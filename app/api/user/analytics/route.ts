import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

interface GenreBreakdown {
  genre: string;
  percentage: number;
  hours: number;
}

interface Insight {
  icon: string;
  label: string;
  value: string;
}

/**
 * GET /api/user/analytics
 *
 * Returns analytics data for a user's gaming library.
 * Premium feature - requires authenticated premium user.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Verify user exists and check premium status
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        supabaseUserId: true,
        subscriptionTier: true,
        gamesAnalyzed: true,
        totalPlaytimeHours: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is premium
    const isPremium = userProfile.subscriptionTier === 'premium';

    if (!isPremium) {
      return NextResponse.json(
        { error: 'Premium subscription required for analytics' },
        { status: 403 }
      );
    }

    // Verify the requesting user owns this profile
    if (supabaseUser && userProfile.supabaseUserId !== supabaseUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's games with playtime data
    const userGames = await prisma.userGame.findMany({
      where: { userId },
      select: {
        appId: true,
        playtimeMinutes: true,
        lastPlayed: true,
        game: {
          select: {
            name: true,
            metadata: true,
          },
        },
      },
      orderBy: { playtimeMinutes: 'desc' },
    });

    // Calculate genre breakdown
    const genreHours: Record<string, number> = {};
    let totalPlaytimeHours = 0;

    for (const userGame of userGames) {
      const hours = userGame.playtimeMinutes / 60;
      totalPlaytimeHours += hours;

      const metadata = userGame.game.metadata as any;
      const genres: string[] = metadata?.genres || [];

      // Distribute playtime across genres
      for (const genre of genres) {
        genreHours[genre] = (genreHours[genre] || 0) + hours;
      }
    }

    // Sort genres by hours and take top 10
    const sortedGenres = Object.entries(genreHours)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const genreBreakdown: GenreBreakdown[] = sortedGenres.map(([genre, hours]) => ({
      genre,
      hours: Math.round(hours),
      percentage: totalPlaytimeHours > 0 ? Math.round((hours / totalPlaytimeHours) * 100) : 0,
    }));

    // Calculate insights
    const insights: Insight[] = [];

    // Favorite genre (highest playtime)
    if (genreBreakdown.length > 0) {
      // Check for genre combinations
      const topGenres = genreBreakdown.slice(0, 2);
      if (topGenres.length >= 2 && topGenres[1].percentage > topGenres[0].percentage * 0.7) {
        insights.push({
          icon: '🎮',
          label: 'Favorite Genre',
          value: `${topGenres[0].genre} / ${topGenres[1].genre}`,
        });
      } else {
        insights.push({
          icon: '🎮',
          label: 'Favorite Genre',
          value: topGenres[0].genre,
        });
      }
    }

    // Most played game
    if (userGames.length > 0) {
      const topGame = userGames[0];
      const topGameHours = Math.round(topGame.playtimeMinutes / 60);
      insights.push({
        icon: '👑',
        label: 'Most Played',
        value: `${topGame.game.name} (${topGameHours}h)`,
      });
    }

    // Gaming activity (based on recent play)
    const recentGames = userGames.filter(g => {
      if (!g.lastPlayed) return false;
      const daysSincePlay = (Date.now() - new Date(g.lastPlayed).getTime()) / (1000 * 60 * 60 * 24);
      return daysSincePlay < 30;
    });

    if (recentGames.length >= 5) {
      insights.push({
        icon: '🔥',
        label: 'Activity Level',
        value: 'Very Active',
      });
    } else if (recentGames.length >= 2) {
      insights.push({
        icon: '⚡',
        label: 'Activity Level',
        value: 'Active',
      });
    } else {
      insights.push({
        icon: '😴',
        label: 'Activity Level',
        value: 'Casual',
      });
    }

    // Games with high playtime (>20 hours)
    const deepDiveGames = userGames.filter(g => g.playtimeMinutes > 20 * 60);
    const completionRate = userGames.length > 0
      ? Math.round((deepDiveGames.length / userGames.length) * 100)
      : 0;

    insights.push({
      icon: '🏆',
      label: 'Deep Dive Rate',
      value: `${completionRate}% (${deepDiveGames.length} games)`,
    });

    // Gaming personality based on genre spread
    const genreCount = Object.keys(genreHours).length;
    let personality = 'Explorer';
    if (genreCount <= 3) {
      personality = 'Specialist';
    } else if (genreCount <= 6) {
      personality = 'Focused';
    } else if (genreCount <= 10) {
      personality = 'Versatile';
    }

    insights.push({
      icon: '🧬',
      label: 'Gamer Type',
      value: personality,
    });

    // Calculate "unique taste" score based on genre diversity and niche preferences
    const avgHoursPerGenre = totalPlaytimeHours / Math.max(genreCount, 1);
    const genreVariance = sortedGenres.reduce((acc, [_, hours]) => {
      return acc + Math.pow(hours - avgHoursPerGenre, 2);
    }, 0) / Math.max(genreCount, 1);

    // Higher variance = more specialized = higher uniqueness
    const uniquenessScore = Math.min(95, Math.max(25, 50 + Math.sqrt(genreVariance) / 10));

    // Average playtime per game
    const avgPlaytimeHours = userGames.length > 0
      ? Math.round(totalPlaytimeHours / userGames.length)
      : 0;

    return NextResponse.json({
      success: true,
      analytics: {
        genreBreakdown,
        insights,
        summary: {
          totalGames: userGames.length,
          totalPlaytimeHours: Math.round(totalPlaytimeHours),
          avgPlaytimeHours,
          uniquenessScore: Math.round(uniquenessScore),
          genreCount,
          deepDiveGames: deepDiveGames.length,
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}
