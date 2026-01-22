/**
 * User Preference Vector Generation
 *
 * Generates personalized 384-dimensional recommendation vectors from user's
 * Steam library using sophisticated playtime-weighted averaging.
 *
 * Algorithm combines:
 * - Playtime weighting (logarithmic with penalties for <2hrs)
 * - Recency weighting (exponential decay)
 * - Quality signals (completion ratio, achievements)
 * - Genre diversity normalization (prevents single genre dominance)
 */

import { getGameWithEmbedding } from './vector-db';

export interface UserGameData {
  appId: bigint;
  playtimeMinutes: number;
  lastPlayed?: Date;
  achievementsEarned?: number;
  achievementsTotal?: number;
  genres?: string[]; // From game metadata
  avgCompletionHours?: number; // Optional: from HowLongToBeat data
}

export interface WeightingOptions {
  /**
   * Recency decay half-life in months.
   * Default: 24 months (games from 2 years ago have 50% weight)
   */
  recencyDecayMonths?: number;

  /**
   * Enable genre diversity normalization.
   * Prevents single genre from dominating recommendations.
   * Default: true
   */
  enableGenreDiversification?: boolean;

  /**
   * Minimum playtime (hours) to include game in profile.
   * Games below this are excluded entirely.
   * Default: 0.5 hours (30 minutes)
   */
  minPlaytimeHours?: number;

  /**
   * Maximum number of games to include (use top N by weighted score).
   * Helps with performance for users with 1000+ game libraries.
   * Default: 200
   */
  maxGamesToInclude?: number;

  /**
   * Enable quality/completion weighting.
   * Uses achievement completion and playtime vs average completion time.
   * Default: true
   */
  enableQualityWeighting?: boolean;
}

/**
 * Calculate playtime weight using logarithmic scaling.
 *
 * Philosophy:
 * - < 2 hours: Minimal signal (tried it, maybe didn't like)
 * - 2-10 hours: Some interest
 * - 10-50 hours: Strong interest (most meaningful)
 * - 50-200 hours: Deep engagement
 * - 200+ hours: Obsessed (capped to prevent single-game dominance)
 */
export function calculatePlaytimeWeight(playHours: number): number {
  if (playHours < 2) {
    // Very low weight for < 2 hours (often refunded or disliked)
    return 0.1 + (playHours / 2) * 0.4; // 0.1 to 0.5
  } else if (playHours < 10) {
    // Growing interest zone
    return 0.5 + ((playHours - 2) / 8) * 0.5; // 0.5 to 1.0
  } else if (playHours < 50) {
    // Sweet spot for genuine interest
    return 1.0 + Math.log10(playHours - 9) * 0.5; // 1.0 to ~1.8
  } else if (playHours < 200) {
    // Deep engagement
    return 2.0 + Math.log10(playHours - 49) * 0.3; // 2.0 to ~2.45
  } else {
    // Aggressive cap to prevent 1000+ hour games from overwhelming
    // 200hrs = 2.5, 1000hrs = 2.54 (much flatter)
    return 2.5 + Math.log10(playHours - 199) * 0.05; // 2.5 to ~2.54 max
  }
}

/**
 * Calculate recency weight using exponential decay.
 *
 * Recent games = current taste
 * Old games = historical taste (still counts but less)
 */
export function calculateRecencyWeight(
  lastPlayedDate: Date | undefined,
  decayMonths: number = 24
): number {
  if (!lastPlayedDate) {
    // No last played data - assume moderate recency
    return 0.5;
  }

  const monthsAgo =
    (Date.now() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24 * 30);

  // Exponential decay with specified half-life
  const weight = Math.pow(0.5, monthsAgo / decayMonths);

  // Floor at 0.2 so old favorites aren't completely ignored
  return Math.max(0.2, weight);
}

/**
 * Calculate quality/completion weight.
 *
 * Games that were completed or highly engaged with = stronger signal
 */
export function calculateQualityWeight(game: {
  playHours: number;
  avgCompletionHours?: number;
  achievementsEarned?: number;
  achievementsTotal?: number;
}): number {
  let weight = 1.0;

  // 1. Completion ratio boost (if data available)
  if (game.avgCompletionHours && game.avgCompletionHours > 0) {
    const completionRatio = game.playHours / game.avgCompletionHours;

    if (completionRatio > 0.8) {
      // Completed or near-completed = strong signal
      weight *= 1.3;
    } else if (completionRatio < 0.2) {
      // Abandoned early = weak signal
      weight *= 0.7;
    }
    // 0.2-0.8 = neutral (no adjustment)
  }

  // 2. Achievement ratio boost
  if (
    game.achievementsEarned !== undefined &&
    game.achievementsTotal !== undefined &&
    game.achievementsTotal > 0
  ) {
    const achRatio = game.achievementsEarned / game.achievementsTotal;

    if (achRatio > 0.5) {
      // Engaged with achievements = liked it
      weight *= 1.2;
    } else if (achRatio < 0.1 && game.playHours > 10) {
      // Lots of playtime but no achievements = less engaged
      weight *= 0.9;
    }
  }

  return weight;
}

/**
 * Calculate combined weight for a game.
 */
export function calculateGameWeight(
  game: UserGameData,
  options: WeightingOptions = {}
): number {
  const playHours = game.playtimeMinutes / 60;

  // Playtime weight (primary signal)
  const playtimeWeight = calculatePlaytimeWeight(playHours);

  // Recency weight
  const recencyWeight = calculateRecencyWeight(
    game.lastPlayed,
    options.recencyDecayMonths ?? 24
  );

  // Quality weight (if enabled)
  const qualityWeight = options.enableQualityWeighting !== false
    ? calculateQualityWeight({
        playHours,
        avgCompletionHours: game.avgCompletionHours,
        achievementsEarned: game.achievementsEarned,
        achievementsTotal: game.achievementsTotal,
      })
    : 1.0;

  return playtimeWeight * recencyWeight * qualityWeight;
}

/**
 * Normalize weights for genre and franchise diversity.
 *
 * Problem: User with 500 hours across 10 FPS games will get FPS-only recommendations.
 * Worse: User with 300 hours in Total War: Warhammer series dominates recommendations.
 *
 * Solution: Reduce weight for overrepresented genres AND franchises using sqrt normalization.
 */
function normalizeForGenreDiversity(
  gamesWithWeights: Array<{
    appId: bigint;
    weight: number;
    genres: string[];
    tags: string[];
  }>
): Map<bigint, number> {
  // Common franchise identifiers (tags that indicate series/universe)
  const franchiseTags = [
    'Warhammer',
    'Total War',
    'Call of Duty',
    'Assassin\'s Creed',
    'Grand Theft Auto',
    'The Elder Scrolls',
    'Fallout',
    'Battlefield',
    'Far Cry',
    'Civilization',
    'Dark Souls',
    'Souls-like',
    'Pokemon',
    'Final Fantasy',
    'LEGO',
    'Star Wars',
    'Marvel',
    'DC Comics',
    'Harry Potter',
    'Lord of the Rings',
    'Witcher',
    'Dragon Age',
    'Mass Effect',
    'Borderlands',
    'Metro',
    'Resident Evil',
    'Silent Hill',
    'Persona',
    'Kingdom Hearts',
  ];

  // Count games per primary genre
  const genreCounts = new Map<string, number>();
  gamesWithWeights.forEach(game => {
    const primaryGenre = game.genres[0] || 'Unknown';
    genreCounts.set(primaryGenre, (genreCounts.get(primaryGenre) || 0) + 1);
  });

  // Count games per franchise tag
  const franchiseCounts = new Map<string, number>();
  gamesWithWeights.forEach(game => {
    const tags = game.tags || [];

    // Find all matching franchise tags (a game can have multiple, e.g., "Star Wars" + "LEGO")
    const matchingFranchises = franchiseTags.filter(franchise =>
      tags.some(tag => tag.toLowerCase().includes(franchise.toLowerCase()))
    );

    matchingFranchises.forEach(franchise => {
      franchiseCounts.set(franchise, (franchiseCounts.get(franchise) || 0) + 1);
    });
  });

  // Apply diversity penalties
  const adjustedWeights = new Map<bigint, number>();

  gamesWithWeights.forEach(game => {
    const primaryGenre = game.genres[0] || 'Unknown';
    const genreCount = genreCounts.get(primaryGenre) || 1;

    // Genre penalty: sqrt normalization
    const genrePenalty = 1 / Math.sqrt(genreCount);

    // Franchise penalty: find strongest franchise match
    const tags = game.tags || [];
    const matchingFranchises = franchiseTags.filter(franchise =>
      tags.some(tag => tag.toLowerCase().includes(franchise.toLowerCase()))
    );

    let franchisePenalty = 1.0;
    if (matchingFranchises.length > 0) {
      // If game matches multiple franchises, use the one with highest count (strongest penalty)
      const maxFranchiseCount = Math.max(
        ...matchingFranchises.map(f => franchiseCounts.get(f) || 1)
      );
      franchisePenalty = 1 / Math.sqrt(maxFranchiseCount);
    }

    // Combined penalty (multiply both)
    // Example: 9 strategy games + 3 Warhammer games -> 1/3 * 1/1.73 = 0.192x weight
    const combinedPenalty = genrePenalty * franchisePenalty;

    adjustedWeights.set(game.appId, game.weight * combinedPenalty);
  });

  return adjustedWeights;
}

/**
 * Generate user preference vector from played games.
 *
 * Returns weighted average of game embeddings based on playtime, recency, and quality.
 */
export async function generateUserPreferenceVector(
  userGames: UserGameData[],
  options: WeightingOptions = {}
): Promise<{
  vector: number[];
  gamesAnalyzed: number;
  totalWeight: number;
  stats: {
    minPlaytime: number;
    maxPlaytime: number;
    avgPlaytime: number;
    gamesSkipped: number;
    gamesIncluded: number;
  };
} | null> {
  const minPlaytimeHours = options.minPlaytimeHours ?? 0.5;
  const maxGamesToInclude = options.maxGamesToInclude ?? 200;

  // Step 1: Filter by minimum playtime
  const filteredGames = userGames.filter(
    game => game.playtimeMinutes / 60 >= minPlaytimeHours
  );

  if (filteredGames.length === 0) {
    console.warn('No games meet minimum playtime threshold');
    return null;
  }

  // Step 2: Calculate initial weights
  const gamesWithWeights = filteredGames.map(game => ({
    ...game,
    weight: calculateGameWeight(game, options),
  }));

  // Step 3: Sort by weight and take top N
  gamesWithWeights.sort((a, b) => b.weight - a.weight);
  const topGames = gamesWithWeights.slice(0, maxGamesToInclude);

  // Step 4: Fetch embeddings from database
  const gamesWithEmbeddings: Array<{
    appId: bigint;
    embedding: number[];
    weight: number;
    genres: string[];
    tags: string[];
  }> = [];

  for (const game of topGames) {
    const gameData = await getGameWithEmbedding(game.appId);

    if (gameData?.embedding) {
      // Extract tags from game metadata
      const tags = Array.isArray(gameData.metadata?.tags)
        ? gameData.metadata.tags
        : [];

      gamesWithEmbeddings.push({
        appId: game.appId,
        embedding: gameData.embedding,
        weight: game.weight,
        genres: game.genres || [],
        tags,
      });
    }
  }

  if (gamesWithEmbeddings.length === 0) {
    console.warn('No games with embeddings found');
    return null;
  }

  // Step 5: Apply genre diversity normalization (if enabled)
  let finalWeights: Map<bigint, number>;

  if (options.enableGenreDiversification !== false) {
    finalWeights = normalizeForGenreDiversity(gamesWithEmbeddings);
  } else {
    finalWeights = new Map(
      gamesWithEmbeddings.map(g => [g.appId, g.weight])
    );
  }

  // Step 6: Calculate weighted average of embeddings
  const vectorDim = 384;
  const summedVector = new Array(vectorDim).fill(0);
  let totalWeight = 0;

  gamesWithEmbeddings.forEach(game => {
    const weight = finalWeights.get(game.appId) || 0;
    totalWeight += weight;

    for (let i = 0; i < vectorDim; i++) {
      summedVector[i] += game.embedding[i] * weight;
    }
  });

  // Normalize by total weight to get average
  const preferenceVector = summedVector.map(val => val / totalWeight);

  // Step 7: Calculate stats
  const playtimes = filteredGames.map(g => g.playtimeMinutes / 60);
  const stats = {
    minPlaytime: Math.min(...playtimes),
    maxPlaytime: Math.max(...playtimes),
    avgPlaytime: playtimes.reduce((a, b) => a + b, 0) / playtimes.length,
    gamesSkipped: userGames.length - filteredGames.length,
    gamesIncluded: gamesWithEmbeddings.length,
  };

  return {
    vector: preferenceVector,
    gamesAnalyzed: gamesWithEmbeddings.length,
    totalWeight,
    stats,
  };
}

/**
 * Update user preference vector in database.
 * Helper function to regenerate and store user's preference vector.
 */
export async function updateUserPreferenceVector(
  userId: string,
  userGames: UserGameData[],
  options: WeightingOptions = {}
): Promise<{
  success: boolean;
  gamesAnalyzed: number;
  error?: string;
}> {
  try {
    const result = await generateUserPreferenceVector(userGames, options);

    if (!result) {
      return {
        success: false,
        gamesAnalyzed: 0,
        error: 'Could not generate preference vector (no valid games)',
      };
    }

    // Import prisma here to avoid circular dependency
    const { prisma } = await import('./prisma');
    const { Prisma } = await import('@prisma/client');

    const vectorString = `[${result.vector.join(',')}]`;
    const totalPlaytimeHours = userGames.reduce(
      (sum, game) => sum + game.playtimeMinutes / 60,
      0
    );

    // Update user profile with new preference vector
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET
        preference_vector = ${Prisma.raw(`'${vectorString}'::vector(384)`)},
        last_updated = NOW(),
        games_analyzed = ${result.gamesAnalyzed},
        total_playtime_hours = ${totalPlaytimeHours}
      WHERE id = ${userId}
    `;

    console.log(
      `Updated preference vector for user ${userId} (${result.gamesAnalyzed} games analyzed)`
    );

    return {
      success: true,
      gamesAnalyzed: result.gamesAnalyzed,
    };
  } catch (error) {
    console.error('Failed to update user preference vector:', error);
    return {
      success: false,
      gamesAnalyzed: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
