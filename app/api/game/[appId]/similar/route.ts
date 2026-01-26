import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/game/:appId/similar
 * Fetch similar games using vector similarity
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const startTime = Date.now();
  try {
    const { appId: appIdStr } = await params;
    console.log(`[Similar Games API] Fetching similar games for ${appIdStr}`);
    const appId = BigInt(appIdStr);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // First, get the target game WITH its embedding (avoids subquery in similarity search)
    const targetCheckStart = Date.now();
    const targetGame = await prisma.$queryRaw<
      Array<{
        name: string;
        embedding: string | null;
      }>
    >`
      SELECT name, embedding::text as embedding
      FROM games
      WHERE app_id = ${appId}
      LIMIT 1
    `;
    console.log(`[Similar Games API] Target fetch took ${Date.now() - targetCheckStart}ms`);

    if (targetGame.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const target = targetGame[0];
    if (!target.embedding) {
      return NextResponse.json(
        { error: 'Game has no embedding for similarity search' },
        { status: 400 }
      );
    }

    // Use the fetched embedding directly (no subquery = much faster)
    const vectorSearchStart = Date.now();
    const similarGames = await prisma.$queryRaw<
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
        (embedding <=> ${target.embedding}::vector(1536)) as distance,
        release_year,
        review_positive_pct,
        review_count,
        is_free,
        metadata
      FROM games
      WHERE embedding IS NOT NULL
        AND app_id != ${appId}
      ORDER BY embedding <=> ${target.embedding}::vector(1536) ASC
      LIMIT ${limit}
    `;
    console.log(`[Similar Games API] Vector search took ${Date.now() - vectorSearchStart}ms`);

    // Format the response
    const formattedGames = similarGames.map((game) => {
      const metadata = game.metadata as any;
      const similarity = 1 - Number(game.distance) / 2; // Convert distance to similarity (0-1)

      return {
        appId: game.app_id.toString(),
        name: game.name,
        similarity,
        distance: Number(game.distance),
        releaseYear: game.release_year,
        reviewScore: game.review_positive_pct,
        reviewCount: game.review_count,
        isFree: game.is_free,
        price: metadata?.price_overview?.final_formatted || (game.is_free ? 'Free' : null),
        headerImage: metadata?.header_image || null,
        genres: metadata?.genres || [],
        developers: metadata?.developers || [],
        shortDescription: metadata?.short_description || null,
      };
    });

    console.log(`[Similar Games API] Total request took ${Date.now() - startTime}ms`);
    return NextResponse.json({
      success: true,
      targetGame: target.name,
      similarGames: formattedGames,
    });
  } catch (error) {
    console.error('Error fetching similar games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch similar games' },
      { status: 500 }
    );
  }
}
