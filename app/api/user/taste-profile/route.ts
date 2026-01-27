import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUserOwnership } from '@/lib/auth';

/**
 * GET /api/user/taste-profile
 *
 * Returns a simple taste profile summary (top genres and tags)
 * based on the user's gaming library. This is a lightweight endpoint
 * that works for all users (not premium-gated).
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

    // Verify user exists
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { id: true, gamesAnalyzed: true },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's games with their metadata (genres, tags)
    const userGames = await prisma.userGame.findMany({
      where: { userId },
      select: {
        appId: true,
        playtimeMinutes: true,
      },
      orderBy: { playtimeMinutes: 'desc' },
      take: 50, // Only look at top 50 games by playtime
    });

    if (userGames.length === 0) {
      return NextResponse.json({
        success: true,
        profile: {
          topGenres: [],
          topTags: [],
          gamesAnalyzed: 0,
        },
      });
    }

    // Get game metadata for these games
    const appIds = userGames.map((g) => g.appId);
    const games = await prisma.game.findMany({
      where: { appId: { in: appIds } },
      select: {
        appId: true,
        metadata: true,
      },
    });

    // Create a map for quick lookup
    const gameMetadataMap = new Map(
      games.map((g) => [g.appId, g.metadata as { genres?: string[]; tags?: string[] } | null])
    );

    // Count genres and tags weighted by playtime
    const genreCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    for (const userGame of userGames) {
      const metadata = gameMetadataMap.get(userGame.appId);
      if (!metadata) continue;

      // Weight by playtime (log scale to prevent one game dominating)
      const weight = Math.log10(Math.max(userGame.playtimeMinutes || 1, 1) + 1);

      // Count genres
      if (metadata.genres && Array.isArray(metadata.genres)) {
        for (const genre of metadata.genres) {
          if (typeof genre === 'string' && genre.trim()) {
            const normalizedGenre = genre.trim();
            genreCounts.set(normalizedGenre, (genreCounts.get(normalizedGenre) || 0) + weight);
          }
        }
      }

      // Count tags
      if (metadata.tags && Array.isArray(metadata.tags)) {
        for (const tag of metadata.tags.slice(0, 10)) { // Only top 10 tags per game
          if (typeof tag === 'string' && tag.trim()) {
            const normalizedTag = tag.trim();
            tagCounts.set(normalizedTag, (tagCounts.get(normalizedTag) || 0) + weight);
          }
        }
      }
    }

    // Sort and get top genres/tags
    const sortedGenres = [...genreCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    // Filter out generic tags, keep interesting descriptive ones
    const genericTags = new Set([
      'Singleplayer', 'Multiplayer', 'Great Soundtrack', 'Controller',
      'Full controller support', 'Steam Achievements', 'Steam Cloud',
      'Steam Trading Cards', 'Partial Controller Support', 'Co-op',
      'Online Co-Op', 'Local Co-Op', 'Remote Play', 'Remote Play Together',
      'Workshop', 'Moddable', 'Level Editor', 'Includes level editor',
    ]);

    const sortedTags = [...tagCounts.entries()]
      .filter(([tag]) => !genericTags.has(tag) && !sortedGenres.includes(tag))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return NextResponse.json({
      success: true,
      profile: {
        topGenres: sortedGenres,
        topTags: sortedTags,
        gamesAnalyzed: userProfile.gamesAnalyzed || userGames.length,
      },
    });
  } catch (error) {
    console.error('Error fetching taste profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch taste profile' },
      { status: 500 }
    );
  }
}
