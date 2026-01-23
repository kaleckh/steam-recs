import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateEmbedding } from '@/lib/embeddings';

/**
 * GET /api/search?q=query&type=basic|semantic
 * Search for games by name or semantic meaning
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const searchType = searchParams.get('type') || 'basic'; // 'basic' or 'semantic'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    // Basic search - fuzzy title matching
    if (searchType === 'basic') {
      const games = await prisma.$queryRaw<
        Array<{
          app_id: bigint;
          name: string;
          release_year: number | null;
          review_positive_pct: number | null;
          review_count: number | null;
          is_free: boolean | null;
          metadata: any;
        }>
      >`
        SELECT
          app_id,
          name,
          release_year,
          review_positive_pct,
          review_count,
          is_free,
          metadata
        FROM games
        WHERE name ILIKE ${`%${query}%`}
        ORDER BY review_count DESC NULLS LAST
        LIMIT ${limit}
      `;

      const formattedGames = games.map((game) => {
        const metadata = game.metadata as any;
        return {
          appId: game.app_id.toString(),
          name: game.name,
          releaseYear: game.release_year,
          reviewScore: game.review_positive_pct,
          reviewCount: game.review_count,
          isFree: game.is_free,
          headerImage: metadata?.header_image || null,
          genres: metadata?.genres || [],
          shortDescription: metadata?.short_description || null,
          price: metadata?.price_overview?.final_formatted || (game.is_free ? 'Free' : null),
        };
      });

      return NextResponse.json({
        success: true,
        type: 'basic',
        query,
        count: formattedGames.length,
        games: formattedGames,
      });
    }

    // Semantic search - vector similarity
    if (searchType === 'semantic') {
      // Generate embedding for the search query
      const queryEmbedding = await generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      const games = await prisma.$queryRaw<
        Array<{
          app_id: bigint;
          name: string;
          distance: number;
          release_year: number | null;
          review_positive_pct: number | null;
          review_count: number | null;
          is_free: boolean | null;
          metadata: any;
        }>
      >`
        SELECT
          app_id,
          name,
          (embedding <=> ${vectorString}::vector(384)) as distance,
          release_year,
          review_positive_pct,
          review_count,
          is_free,
          metadata
        FROM games
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorString}::vector(384) ASC
        LIMIT ${limit}
      `;

      const formattedGames = games.map((game) => {
        const metadata = game.metadata as any;
        const similarity = 1 - Number(game.distance) / 2;

        return {
          appId: game.app_id.toString(),
          name: game.name,
          similarity,
          distance: Number(game.distance),
          releaseYear: game.release_year,
          reviewScore: game.review_positive_pct,
          reviewCount: game.review_count,
          isFree: game.is_free,
          headerImage: metadata?.header_image || null,
          genres: metadata?.genres || [],
          shortDescription: metadata?.short_description || null,
          price: metadata?.price_overview?.final_formatted || (game.is_free ? 'Free' : null),
        };
      });

      return NextResponse.json({
        success: true,
        type: 'semantic',
        query,
        count: formattedGames.length,
        games: formattedGames,
      });
    }

    return NextResponse.json(
      { error: 'Invalid search type. Use "basic" or "semantic"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
