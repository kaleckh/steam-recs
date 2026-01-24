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
  try {
    const { appId: appIdStr } = await params;
    const appId = BigInt(appIdStr);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');

    // First, get the target game to ensure it exists
    const targetGame = await prisma.game.findUnique({
      where: { appId },
      select: { name: true },
    });

    if (!targetGame) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Use raw SQL for vector similarity search
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
        (embedding <=> (SELECT embedding FROM games WHERE app_id = ${appId})::vector(1536)) as distance,
        release_year,
        review_positive_pct,
        review_count,
        is_free,
        metadata
      FROM games
      WHERE embedding IS NOT NULL
        AND app_id != ${appId}
      ORDER BY embedding <=> (SELECT embedding FROM games WHERE app_id = ${appId})::vector(1536) ASC
      LIMIT ${limit}
    `;

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

    return NextResponse.json({
      success: true,
      targetGame: targetGame.name,
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
