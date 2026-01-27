import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserOwnership } from '@/lib/auth';

/**
 * GET /api/user/daily-discovery
 *
 * Returns the user's personalized "Daily Discovery" - a perfect game pick
 * that changes once per day. Uses deterministic randomness based on
 * userId + date so the same user gets the same pick all day.
 *
 * Query params:
 * - userId: string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify the authenticated user owns this profile
    const { authorized, errorResponse } = await verifyUserOwnership(userId);
    if (!authorized) {
      return errorResponse!;
    }

    // Check if user exists and has a preference vector
    const userProfile = await prisma.$queryRaw<Array<{ id: string; games_analyzed: number | null; has_vector: boolean }>>`
      SELECT id, games_analyzed, preference_vector IS NOT NULL as has_vector
      FROM user_profiles
      WHERE id = ${userId}
    `;

    if (!userProfile || userProfile.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userProfile[0].has_vector) {
      return NextResponse.json({
        success: false,
        error: 'Sync your Steam library first to get daily discoveries',
      });
    }

    // Get today's date as YYYY-MM-DD for consistent daily picks
    const today = new Date().toISOString().split('T')[0];

    // Create a deterministic seed from userId + date
    const seed = hashCode(`${userId}-${today}`);

    // Get user's owned games to exclude
    const ownedGames = await prisma.userGame.findMany({
      where: { userId },
      select: { appId: true },
    });
    // Convert BigInt to string for SQL
    const ownedAppIds = ownedGames.map((g) => g.appId.toString());

    // Get top 50 matches to pick from (gives us variety while maintaining quality)
    // Build exclusion list for owned games
    const excludeClause = ownedAppIds.length > 0
      ? `AND g.app_id NOT IN (${ownedAppIds.join(',')})`
      : '';

    const topMatches = await prisma.$queryRawUnsafe<
      Array<{
        app_id: bigint;
        name: string;
        similarity: number;
        review_positive_pct: number | null;
        review_count: number | null;
        release_year: number | null;
        is_free: boolean | null;
        metadata: any;
      }>
    >(`
      SELECT
        g.app_id,
        g.name,
        1 - (g.embedding <=> up.preference_vector) as similarity,
        g.review_positive_pct,
        g.review_count,
        g.release_year,
        g.is_free,
        g.metadata
      FROM games g
      CROSS JOIN user_profiles up
      WHERE up.id = $1
        AND up.preference_vector IS NOT NULL
        AND g.embedding IS NOT NULL
        AND g.review_positive_pct >= 70
        AND g.review_count >= 100
        ${excludeClause}
      ORDER BY similarity DESC
      LIMIT 50
    `, userId);

    if (topMatches.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No recommendations available. Try syncing your Steam library.',
      });
    }

    // Use seeded random to pick from top matches
    // This ensures the same user gets the same pick all day
    const pickIndex = Math.abs(seed) % topMatches.length;
    const dailyPick = topMatches[pickIndex];

    const metadata = dailyPick.metadata as any;

    // Calculate time until next pick (midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const msUntilRefresh = tomorrow.getTime() - now.getTime();
    const hoursUntilRefresh = Math.floor(msUntilRefresh / (1000 * 60 * 60));
    const minutesUntilRefresh = Math.floor((msUntilRefresh % (1000 * 60 * 60)) / (1000 * 60));

    return NextResponse.json({
      success: true,
      dailyPick: {
        appId: dailyPick.app_id.toString(),
        name: dailyPick.name,
        similarity: dailyPick.similarity,
        matchPercent: Math.round(dailyPick.similarity * 100),
        headerImage: metadata?.header_image || null,
        reviewScore: dailyPick.review_positive_pct,
        reviewCount: dailyPick.review_count,
        releaseYear: dailyPick.release_year,
        isFree: dailyPick.is_free,
        price: metadata?.price || null,
        genres: metadata?.genres || [],
        tags: metadata?.tags?.slice(0, 5) || [],
        shortDescription: metadata?.short_description || null,
        developers: metadata?.developers || [],
      },
      meta: {
        date: today,
        refreshIn: {
          hours: hoursUntilRefresh,
          minutes: minutesUntilRefresh,
          formatted: `${hoursUntilRefresh}h ${minutesUntilRefresh}m`,
        },
        poolSize: topMatches.length,
      },
    });
  } catch (error) {
    console.error('Error fetching daily discovery:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch daily discovery: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * Simple string hash function for deterministic seeding
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}
