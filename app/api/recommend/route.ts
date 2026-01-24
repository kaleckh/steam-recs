import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// Request body types
interface RecommendRequest {
  userVector: number[];
  limit?: number;
  excludeAppIds?: number[];
  nicheBoost?: boolean; // Optional: boost games with lower review counts
}

// Response types
interface RecommendationResult {
  appId: string;
  name: string;
  distance: number;
  reviewScore?: number;
  reviewCount?: number;
  genres?: string[];
  shortDescription?: string;
}

/**
 * POST /api/recommend
 *
 * Generate game recommendations based on a user embedding vector.
 * Uses pgvector cosine distance to find similar games.
 *
 * Body:
 * - userVector: number[] (1536 dimensions - OpenAI text-embedding-3-small)
 * - limit?: number (default 10, max 100)
 * - excludeAppIds?: number[] (games to exclude, e.g. already owned)
 * - nicheBoost?: boolean (boost lesser-known games)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationError = validateRequest(body);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

    const {
      userVector,
      limit = 10,
      excludeAppIds = [],
      nicheBoost = false,
    } = body as RecommendRequest;

    // Generate recommendations
    const recommendations = await generateRecommendations({
      userVector,
      limit,
      excludeAppIds,
      nicheBoost,
    });

    return NextResponse.json({
      success: true,
      count: recommendations.length,
      recommendations,
    });
  } catch (error) {
    console.error('Recommendation error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Validate the recommendation request.
 */
function validateRequest(body: any): string | null {
  // Check userVector exists and is array
  if (!body.userVector || !Array.isArray(body.userVector)) {
    return 'userVector must be an array';
  }

  // Check vector dimensions (OpenAI text-embedding-3-small)
  if (body.userVector.length !== 1536) {
    return `userVector must have exactly 1536 dimensions (got ${body.userVector.length})`;
  }

  // Check all elements are numbers
  if (!body.userVector.every((val: any) => typeof val === 'number' && !isNaN(val))) {
    return 'All userVector elements must be valid numbers';
  }

  // Validate limit
  if (body.limit !== undefined) {
    if (typeof body.limit !== 'number' || body.limit < 1) {
      return 'limit must be a positive number';
    }
    if (body.limit > 100) {
      return 'limit must not exceed 100';
    }
  }

  // Validate excludeAppIds
  if (body.excludeAppIds !== undefined) {
    if (!Array.isArray(body.excludeAppIds)) {
      return 'excludeAppIds must be an array';
    }
    if (!body.excludeAppIds.every((id: any) => typeof id === 'number' && Number.isInteger(id))) {
      return 'All excludeAppIds elements must be integers';
    }
  }

  // Validate nicheBoost
  if (body.nicheBoost !== undefined && typeof body.nicheBoost !== 'boolean') {
    return 'nicheBoost must be a boolean';
  }

  return null;
}

/**
 * Generate recommendations using pgvector cosine distance.
 */
async function generateRecommendations({
  userVector,
  limit,
  excludeAppIds,
  nicheBoost,
}: Required<Omit<RecommendRequest, 'limit'>> & { limit: number }): Promise<RecommendationResult[]> {
  // Convert vector to pgvector format string
  const vectorString = `[${userVector.join(',')}]`;

  // Build exclude condition for SQL
  const excludeCondition = excludeAppIds.length > 0
    ? Prisma.sql`AND app_id != ALL(ARRAY[${Prisma.join(excludeAppIds.map(id => Prisma.sql`${BigInt(id)}`), ',')}]::bigint[])`
    : Prisma.empty;

  // Build niche boost logic
  // Formula: Boost games with lower review counts by reducing their effective distance
  // distance * (1 - boost_factor), where boost_factor is based on review_count percentile
  // Example: A game with very few reviews gets up to 20% distance reduction
  const distanceExpression = nicheBoost
    ? Prisma.sql`
      (embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)}) * 
      CASE 
        WHEN (metadata->>'review_count')::int IS NOT NULL AND (metadata->>'review_count')::int < 1000 
        THEN 0.8  -- 20% boost for games with < 1000 reviews
        WHEN (metadata->>'review_count')::int IS NOT NULL AND (metadata->>'review_count')::int < 5000 
        THEN 0.9  -- 10% boost for games with < 5000 reviews
        ELSE 1.0  -- No boost for popular games
      END`
    : Prisma.sql`embedding <=> ${Prisma.raw(`'${vectorString}'::vector(1536)`)}`;

  // Execute vector similarity search
  // Uses <=> operator for cosine distance (optimized by HNSW index)
  const results = await prisma.$queryRaw<Array<{
    app_id: bigint;
    name: string;
    distance: number;
    metadata: any;
  }>>`
    SELECT 
      app_id,
      name,
      ${distanceExpression} as distance,
      metadata
    FROM games
    WHERE embedding IS NOT NULL
      ${excludeCondition}
    ORDER BY distance ASC
    LIMIT ${limit}
  `;

  // Transform results to response format
  return results.map(row => {
    const metadata = row.metadata || {};
    
    return {
      appId: row.app_id.toString(),
      name: row.name,
      distance: Number(row.distance),
      reviewScore: metadata.review_score ? Number(metadata.review_score) : undefined,
      reviewCount: metadata.review_count ? Number(metadata.review_count) : undefined,
      genres: metadata.genres as string[] | undefined,
      shortDescription: metadata.short_description as string | undefined,
    };
  });
}
