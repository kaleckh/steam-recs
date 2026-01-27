import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/unplayed-gems
 *
 * Returns games the user owns but hasn't played much that are high matches
 * for their taste profile. The "hidden gems in your library" feature.
 *
 * Query params:
 * - userId: string (required)
 * - limit: number (default: 5)
 * - maxPlaytime: number in minutes (default: 120 = 2 hours)
 * - minSimilarity: number 0-1 (default: 0.80)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');
    const maxPlaytime = parseInt(searchParams.get('maxPlaytime') || '120');
    const minSimilarity = parseFloat(searchParams.get('minSimilarity') || '0.80');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user has a preference vector
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Find unplayed/underplayed games that match user's taste
    const unplayedGems = await prisma.$queryRaw<
      Array<{
        app_id: bigint;
        name: string;
        playtime_minutes: number;
        similarity: number;
        review_positive_pct: number | null;
        review_count: number | null;
        release_year: number | null;
        metadata: any;
      }>
    >`
      SELECT
        g.app_id,
        g.name,
        ug.playtime_minutes,
        1 - (g.embedding <=> up.preference_vector) as similarity,
        g.review_positive_pct,
        g.review_count,
        g.release_year,
        g.metadata
      FROM games g
      JOIN user_games ug ON g.app_id = ug.app_id
      JOIN user_profiles up ON ug.user_id = up.id
      WHERE ug.user_id = ${userId}
        AND ug.playtime_minutes < ${maxPlaytime}
        AND up.preference_vector IS NOT NULL
        AND g.embedding IS NOT NULL
        AND 1 - (g.embedding <=> up.preference_vector) > ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    // Format the response
    const gems = unplayedGems.map((game) => {
      const metadata = game.metadata as any;
      return {
        appId: game.app_id.toString(),
        name: game.name,
        playtimeMinutes: game.playtime_minutes,
        playtimeFormatted: game.playtime_minutes < 60
          ? `${game.playtime_minutes}m`
          : `${Math.round(game.playtime_minutes / 60 * 10) / 10}h`,
        similarity: game.similarity,
        matchPercent: Math.round(game.similarity * 100),
        headerImage: metadata?.header_image || null,
        reviewScore: game.review_positive_pct,
        reviewCount: game.review_count,
        releaseYear: game.release_year,
        genres: metadata?.genres || [],
        tags: metadata?.tags?.slice(0, 5) || [],
        reason: generateReason(game.playtime_minutes, game.similarity),
      };
    });

    return NextResponse.json({
      success: true,
      gems,
      count: gems.length,
      message: gems.length > 0
        ? `Found ${gems.length} hidden gems in your library!`
        : 'No unplayed gems found. Try playing more games or adjusting filters.',
    });
  } catch (error) {
    console.error('Error fetching unplayed gems:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch unplayed gems' },
      { status: 500 }
    );
  }
}

function generateReason(playtimeMinutes: number, similarity: number): string {
  const matchPercent = Math.round(similarity * 100);

  if (playtimeMinutes === 0) {
    return `${matchPercent}% match - You've never launched this!`;
  } else if (playtimeMinutes < 30) {
    return `${matchPercent}% match - Only tried for ${playtimeMinutes} minutes`;
  } else if (playtimeMinutes < 60) {
    return `${matchPercent}% match - Played less than an hour`;
  } else {
    const hours = Math.round(playtimeMinutes / 60 * 10) / 10;
    return `${matchPercent}% match - Only ${hours}h played`;
  }
}
