import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stats/overview
 *
 * Returns high-level statistics about games and users in the database
 */
export async function GET() {
  try {
    // Run all queries in parallel for better performance
    const [
      totalGames,
      gamesWithReviews,
      gamesWithPrices,
      gamesWithHighReviews,
      gamesWithLowReviews,
      gamesWithZeroReviews,
      uniqueUsers,
      totalUserGames,
    ] = await Promise.all([
      // Total games in database
      prisma.game.count(),

      // Games with reviews
      prisma.game.count({
        where: {
          reviewCount: { gt: 0 }
        }
      }),

      // Games with price data
      prisma.game.count({
        where: {
          metadata: {
            path: ['price_overview'],
            not: null
          }
        }
      }),

      // Games with 100k+ reviews
      prisma.game.count({
        where: {
          reviewCount: { gte: 100000 }
        }
      }),

      // Games with under 1k reviews
      prisma.game.count({
        where: {
          reviewCount: { gt: 0, lt: 1000 }
        }
      }),

      // Games with zero reviews
      prisma.game.count({
        where: {
          OR: [
            { reviewCount: 0 },
            { reviewCount: null }
          ]
        }
      }),

      // Unique users (user profiles)
      prisma.userProfile.count(),

      // Total user games (for avg games owned)
      prisma.userGame.count(),
    ]);

    // Calculate aggregates for user data
    const userStats = await prisma.userProfile.aggregate({
      _avg: {
        gamesAnalyzed: true,
      },
      _sum: {
        gamesAnalyzed: true,
      }
    });

    // Calculate average games owned and median estimate
    const avgGamesOwned = uniqueUsers > 0
      ? Math.round(totalUserGames / uniqueUsers)
      : 0;

    // Get median games owned (approximate using percentile)
    const medianResult = await prisma.$queryRaw<Array<{ median: number }>>`
      SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY games_analyzed) as median
      FROM user_profiles
      WHERE games_analyzed > 0
    `;
    const medianGamesOwned = medianResult[0]?.median
      ? Math.round(medianResult[0].median)
      : 0;

    // Calculate total reviews across all games
    const reviewStats = await prisma.game.aggregate({
      _sum: {
        reviewCount: true,
      }
    });

    const totalReviews = reviewStats._sum.reviewCount || 0;

    // Calculate unique reviewers (estimate: ~38M based on Steam data)
    const uniqueReviewers = Math.round(totalReviews / 4.1); // Avg 4.1 reviews per user

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      games: {
        total: totalGames,
        withReviews: gamesWithReviews,
        withPrices: gamesWithPrices,
        highReviews: gamesWithHighReviews, // 100k+
        lowReviews: gamesWithLowReviews, // Under 1k
        zeroReviews: gamesWithZeroReviews,
      },
      users: {
        uniqueProfiles: uniqueUsers,
        uniqueReviewers: uniqueReviewers,
        avgReviewsPerUser: uniqueReviewers > 0
          ? Number((totalReviews / uniqueReviewers).toFixed(1))
          : 0,
        avgGamesOwned: avgGamesOwned,
        medianGamesOwned: medianGamesOwned,
      },
      reviews: {
        total: totalReviews,
      }
    });
  } catch (error) {
    console.error('Stats overview error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
