import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getHybridVector, getNotInterestedGames } from '@/lib/vector-learning';

/**
 * POST /api/user/recommend
 *
 * Get personalized recommendations for a user based on their preference vector.
 *
 * Body:
 * - userId: string (user profile ID)
 * - limit?: number (default: 20, max 100)
 * - excludeOwned?: boolean (default: true, exclude games user already owns)
 * - filters?: {
 *     minReviewScore?: number (0-100)
 *     minReviewCount?: number
 *     releaseYearMin?: number
 *     releaseYearMax?: number
 *     isFree?: boolean
 *     genres?: string[] (filter by genre)
 *   }
 *
 * Returns:
 * - List of recommended games with similarity scores and metadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate userId
    if (!body.userId || typeof body.userId !== 'string') {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const limit = Math.min(body.limit || 20, 100);
    const excludeOwned = body.excludeOwned !== false; // Default true

    // Fetch user profile with preference vector and subscription info
    const userProfile = await prisma.$queryRaw<
      Array<{
        id: string;
        steam_id: string | null;
        preference_vector: string | null;
        games_analyzed: number;
        last_updated: Date | null;
        subscription_tier: string;
        subscription_expires_at: Date | null;
      }>
    >`
      SELECT
        id,
        steam_id,
        preference_vector::text as preference_vector,
        games_analyzed,
        last_updated,
        subscription_tier,
        subscription_expires_at
      FROM user_profiles
      WHERE id = ${body.userId}
      LIMIT 1
    `;

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    const user = userProfile[0];

    if (!user.preference_vector) {
      return NextResponse.json(
        {
          error: 'User has no preference vector. Please ingest user library first.',
          userId: user.id,
        },
        { status: 400 }
      );
    }

    // Check if user is premium
    const isPremium = user.subscription_tier === 'premium';
    const isExpired = user.subscription_expires_at &&
                      new Date(user.subscription_expires_at) < new Date();
    const hasPremiumAccess = isPremium && !isExpired;

    // TODO: For now, everyone gets hybrid vector (will restrict to premium later)
    // For premium users, use hybrid vector (preference + learned)
    // For free users, use preference vector only
    let queryVector: number[] | null = null;

    // Always try to get hybrid vector for now
    queryVector = await getHybridVector(body.userId);

    // Fallback to preference vector if hybrid vector not available
    if (!queryVector) {
      // Parse preference vector from database string format
      queryVector = user.preference_vector
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);
    }

    // Convert vector to pgvector format string
    const vectorString = `[${queryVector.join(',')}]`;

    // Get user's owned games (if excluding)
    let ownedAppIds: bigint[] = [];

    if (excludeOwned) {
      const ownedGames = await prisma.userGame.findMany({
        where: { userId: body.userId },
        select: { appId: true },
      });

      ownedAppIds = ownedGames.map(g => g.appId);
    }

    // Get games marked as "not interested" (PREMIUM FEATURE)
    // These games are permanently excluded from recommendations
    let notInterestedAppIds: bigint[] = [];

    // TODO: For now, everyone gets this feature (will restrict to premium later)
    notInterestedAppIds = await getNotInterestedGames(body.userId);

    // Combine owned and not interested games for exclusion
    const excludeAppIds = [...ownedAppIds, ...notInterestedAppIds];

    // Build filter conditions
    const filters = body.filters || {};
    const filterConditions: Prisma.Sql[] = [];

    // Exclude owned games and not interested games
    if (excludeAppIds.length > 0) {
      filterConditions.push(
        Prisma.sql`app_id != ALL(ARRAY[${Prisma.join(
          excludeAppIds.map(id => Prisma.sql`${id}`),
          ','
        )}]::bigint[])`
      );
    }

    // Review score filter
    if (filters.minReviewScore !== undefined) {
      filterConditions.push(
        Prisma.sql`review_positive_pct >= ${filters.minReviewScore}`
      );
    }

    // Review count filter
    if (filters.minReviewCount !== undefined) {
      filterConditions.push(
        Prisma.sql`review_count >= ${filters.minReviewCount}`
      );
    }

    // Release year filters
    if (filters.releaseYearMin !== undefined) {
      filterConditions.push(
        Prisma.sql`release_year >= ${filters.releaseYearMin}`
      );
    }

    if (filters.releaseYearMax !== undefined) {
      filterConditions.push(
        Prisma.sql`release_year <= ${filters.releaseYearMax}`
      );
    }

    // Free-to-play filter
    if (filters.isFree !== undefined) {
      filterConditions.push(Prisma.sql`is_free = ${filters.isFree}`);
    }

    // Genre filter (check JSONB metadata)
    if (filters.genres && filters.genres.length > 0) {
      // Check if any of the specified genres exist in metadata->genres array
      const genreConditions = filters.genres.map((genre: string) =>
        Prisma.sql`metadata->'genres' ? ${genre}`
      );

      filterConditions.push(
        Prisma.sql`(${Prisma.join(genreConditions, ' OR ')})`
      );
    }

    // Popularity filter (Hidden Gems vs Popular)
    if (filters.popularityScore !== undefined) {
      const score = filters.popularityScore;

      if (score < 50) {
        // Hidden Gems: Prefer low review count
        // At 0: max 10k reviews, at 49: max 100k reviews
        const maxReviews = 10000 + (score * 1800);
        filterConditions.push(
          Prisma.sql`review_count <= ${Math.round(maxReviews)}`
        );
        // Ensure quality: require at least 70% positive
        filterConditions.push(Prisma.sql`review_positive_pct >= 70`);
      } else if (score > 50) {
        // Popular: Prefer high review count
        // At 51: min 5k reviews, at 100: min 50k reviews
        const minReviews = 5000 + ((score - 50) * 900);
        filterConditions.push(
          Prisma.sql`review_count >= ${Math.round(minReviews)}`
        );
      }
      // At exactly 50: no popularity filter (balanced)
    }

    // Only include games with embeddings
    filterConditions.push(Prisma.sql`embedding IS NOT NULL`);

    // Combine filter conditions
    const whereClause =
      filterConditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(filterConditions, ' AND ')}`
        : Prisma.empty;

    // Execute vector similarity search
    const recommendations = await prisma.$queryRaw<
      Array<{
        app_id: bigint;
        name: string;
        distance: number;
        release_year: number | null;
        review_positive_pct: number | null;
        review_count: number | null;
        metacritic_score: number | null;
        is_free: boolean | null;
        metadata: any;
      }>
    >`
      SELECT
        app_id,
        name,
        (embedding <=> ${Prisma.raw(`'${vectorString}'::vector(384)`)}) as distance,
        release_year,
        review_positive_pct,
        review_count,
        metacritic_score,
        is_free,
        metadata
      FROM games
      ${whereClause}
      ORDER BY embedding <=> ${Prisma.raw(`'${vectorString}'::vector(384)`)} ASC
      LIMIT ${limit}
    `;

    // Transform results
    const results = recommendations.map(game => {
      const metadata = game.metadata || {};
      const priceOverview = metadata.price_overview as any;

      return {
        appId: game.app_id.toString(),
        name: game.name,
        similarity: 1 - Number(game.distance) / 2, // Convert distance to 0-1 similarity
        distance: Number(game.distance),
        releaseYear: game.release_year,
        reviewScore: game.review_positive_pct,
        reviewCount: game.review_count,
        metacriticScore: game.metacritic_score,
        isFree: game.is_free,
        price: priceOverview?.final_formatted as string | undefined,
        priceRaw: priceOverview?.final as number | undefined,
        genres: metadata.genres as string[] | undefined,
        shortDescription: metadata.short_description as string | undefined,
        headerImage: metadata.header_image as string | undefined,
        developers: metadata.developers as string[] | undefined,
      };
    });

    return NextResponse.json({
      success: true,
      userId: user.id,
      steamId: user.steam_id,
      gamesAnalyzed: user.games_analyzed,
      lastUpdated: user.last_updated,
      isPremium: hasPremiumAccess,
      usingHybridVector: hasPremiumAccess && queryVector !== null,
      gamesExcluded: excludeAppIds.length,
      recommendationCount: results.length,
      recommendations: results,
    });
  } catch (error) {
    console.error('Personalized recommendation error:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate recommendations',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/recommend?userId=xxx
 *
 * Get personalized recommendations with default settings.
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }

  // Forward to POST with default settings
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  );
}
