import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/taste-dna
 *
 * Generates a comprehensive "Taste DNA" profile for sharing.
 * Includes gamer archetype, genre breakdown, rarity score, and stats.
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

    // Get user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        gamesAnalyzed: true,
        totalPlaytimeHours: true,
        feedbackLikesCount: true,
        feedbackDislikesCount: true,
        createdAt: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's games with metadata for analysis
    const userGames = await prisma.userGame.findMany({
      where: { userId },
      select: {
        appId: true,
        playtimeMinutes: true,
        game: {
          select: {
            name: true,
            metadata: true,
            releaseYear: true,
          },
        },
      },
      orderBy: { playtimeMinutes: 'desc' },
    });

    if (userGames.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No games found. Sync your Steam library first.',
      });
    }

    // Analyze genres weighted by playtime
    const genreWeights = new Map<string, number>();
    const tagWeights = new Map<string, number>();
    const decadeWeights = new Map<string, number>();
    let totalPlaytime = 0;

    for (const ug of userGames) {
      const playtime = ug.playtimeMinutes;
      totalPlaytime += playtime;

      const metadata = ug.game.metadata as any;
      const weight = Math.log10(Math.max(playtime, 1) + 1); // Log scale

      // Count genres
      if (metadata?.genres && Array.isArray(metadata.genres)) {
        for (const genre of metadata.genres) {
          genreWeights.set(genre, (genreWeights.get(genre) || 0) + weight);
        }
      }

      // Count tags (top 5 per game)
      if (metadata?.tags && Array.isArray(metadata.tags)) {
        for (const tag of metadata.tags.slice(0, 5)) {
          tagWeights.set(tag, (tagWeights.get(tag) || 0) + weight);
        }
      }

      // Count decades
      if (ug.game.releaseYear) {
        const decade = `${Math.floor(ug.game.releaseYear / 10) * 10}s`;
        decadeWeights.set(decade, (decadeWeights.get(decade) || 0) + weight);
      }
    }

    // Calculate genre percentages
    const totalGenreWeight = [...genreWeights.values()].reduce((a, b) => a + b, 0);
    const genreBreakdown = [...genreWeights.entries()]
      .map(([genre, weight]) => ({
        genre,
        weight,
        percent: Math.round((weight / totalGenreWeight) * 100),
      }))
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 6);

    // Get top tags (excluding generic ones)
    const genericTags = new Set([
      'Singleplayer', 'Multiplayer', 'Great Soundtrack', 'Controller',
      'Full controller support', 'Steam Achievements', 'Steam Cloud',
      'Steam Trading Cards', 'Partial Controller Support', 'Co-op',
      'Online Co-Op', 'Local Co-Op', 'Remote Play', 'Remote Play Together',
      'Workshop', 'Moddable', 'Level Editor', 'Includes level editor',
      'Action', 'Adventure', 'Indie', 'RPG', 'Strategy', 'Simulation',
    ]);

    const topTags = [...tagWeights.entries()]
      .filter(([tag]) => !genericTags.has(tag))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Determine gamer archetype based on patterns
    const archetype = determineArchetype(genreBreakdown, userGames, totalPlaytime);

    // Calculate rarity score (how unique is this taste?)
    const rarityScore = calculateRarityScore(genreBreakdown, topTags);

    // Favorite decade
    const favoritDecade = [...decadeWeights.entries()]
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    // Top 3 most played games
    const topGames = userGames.slice(0, 3).map((ug) => ({
      name: ug.game.name,
      playtimeHours: Math.round(ug.playtimeMinutes / 60),
    }));

    // Calculate engagement stats
    const totalHours = Math.round(totalPlaytime / 60);
    const avgHoursPerGame = Math.round(totalHours / userGames.length);

    return NextResponse.json({
      success: true,
      tasteDna: {
        archetype: archetype,
        rarityScore: rarityScore,
        rarityLabel: getRarityLabel(rarityScore),
        genreBreakdown: genreBreakdown,
        topTags: topTags,
        favoriteDecade: favoritDecade,
        stats: {
          totalGames: userGames.length,
          totalHours: totalHours,
          avgHoursPerGame: avgHoursPerGame,
          gamesAnalyzed: userProfile.gamesAnalyzed || userGames.length,
          ratingsGiven: (userProfile.feedbackLikesCount || 0) + (userProfile.feedbackDislikesCount || 0),
        },
        topGames: topGames,
        memberSince: userProfile.createdAt,
      },
    });
  } catch (error) {
    console.error('Error generating taste DNA:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate taste DNA' },
      { status: 500 }
    );
  }
}

interface GenreData {
  genre: string;
  weight: number;
  percent: number;
}

function determineArchetype(
  genres: GenreData[],
  games: Array<{ playtimeMinutes: number }>,
  totalPlaytime: number
): { name: string; emoji: string; description: string } {
  const topGenre = genres[0]?.genre || '';
  const secondGenre = genres[1]?.genre || '';
  const topPercent = genres[0]?.percent || 0;

  // Calculate concentration (how focused vs diverse)
  const gamesWithPlaytime = games.filter((g) => g.playtimeMinutes > 60);
  const topGamePlaytime = games[0]?.playtimeMinutes || 0;
  const concentration = topGamePlaytime / totalPlaytime;

  // Genre-specific archetypes
  if (topGenre === 'Strategy' && topPercent > 40) {
    return {
      name: 'The Grand Strategist',
      emoji: '🎯',
      description: 'Plans ten moves ahead. Probably has spreadsheets for fun.',
    };
  }

  if (topGenre === 'RPG' && topPercent > 35) {
    return {
      name: 'The Lore Seeker',
      emoji: '📜',
      description: 'Reads every book, talks to every NPC, knows the deep lore.',
    };
  }

  if ((topGenre === 'Action' || topGenre === 'Shooter') && topPercent > 40) {
    return {
      name: 'The Action Hero',
      emoji: '💥',
      description: 'Reflexes of a cat. Prefers explosions to exposition.',
    };
  }

  if (topGenre === 'Simulation' && topPercent > 30) {
    return {
      name: 'The Virtual Architect',
      emoji: '🏗️',
      description: 'Builds worlds, manages empires, optimizes everything.',
    };
  }

  if (topGenre === 'Indie' && topPercent > 25) {
    return {
      name: 'The Indie Explorer',
      emoji: '🔍',
      description: 'Finds gems before they trend. Appreciates artistic vision.',
    };
  }

  // Behavior-based archetypes
  if (concentration > 0.5) {
    return {
      name: 'The Devotee',
      emoji: '💎',
      description: 'When you find the one, you commit. Thousands of hours deep.',
    };
  }

  if (gamesWithPlaytime.length > 50) {
    return {
      name: 'The Collector',
      emoji: '📚',
      description: 'Vast library, curious mind. So many games, so little time.',
    };
  }

  if (topPercent < 25 && genres.length >= 4) {
    return {
      name: 'The Genre Hopper',
      emoji: '🦘',
      description: 'Variety is the spice of gaming. Never bored, always exploring.',
    };
  }

  // Default
  return {
    name: 'The Versatile Gamer',
    emoji: '🎮',
    description: 'Balanced taste, open mind. Enjoys games across the spectrum.',
  };
}

function calculateRarityScore(genres: GenreData[], tags: string[]): number {
  // Base rarity on how non-mainstream the top genres/tags are
  const mainstreamGenres = new Set(['Action', 'Adventure', 'RPG', 'Shooter', 'Sports']);
  const nicheGenres = new Set(['Visual Novel', 'Racing', 'Simulation', 'Strategy']);

  let score = 50; // Start at middle

  // Adjust based on genre diversity
  if (genres.length >= 4 && genres[3]?.percent > 10) {
    score += 10; // Diverse taste is rarer
  }

  // Adjust based on top genre
  const topGenre = genres[0]?.genre;
  if (topGenre && nicheGenres.has(topGenre)) {
    score += 15;
  } else if (topGenre && mainstreamGenres.has(topGenre) && genres[0]?.percent > 50) {
    score -= 10;
  }

  // Niche tags increase rarity
  const nicheTags = ['Roguelike', 'Metroidvania', 'Souls-like', 'City Builder', 'Colony Sim', 'Immersive Sim'];
  const nicheTagCount = tags.filter((t) => nicheTags.includes(t)).length;
  score += nicheTagCount * 8;

  // Clamp between 15-95
  return Math.max(15, Math.min(95, score));
}

function getRarityLabel(score: number): string {
  if (score >= 85) return 'Extraordinarily Unique';
  if (score >= 70) return 'Highly Distinctive';
  if (score >= 55) return 'Notably Individual';
  if (score >= 40) return 'Moderately Common';
  return 'Mainstream Friendly';
}
