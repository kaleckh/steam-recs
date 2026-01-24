/**
 * Vector Learning System for Premium Users
 *
 * Implements dynamic preference learning from user feedback (thumbs up/down).
 * Updates user's learned vector based on liked/disliked games.
 */

import { Prisma } from '@prisma/client';
import prisma from './prisma';
import { getGameWithEmbedding } from './vector-db';

export type FeedbackType = 'like' | 'dislike' | 'not_interested' | 'love';

/**
 * Feedback weights for vector adjustment
 *
 * Philosophy:
 * - 'love' = 0.15 (strongest positive signal)
 * - 'like' = 0.1 (positive signal)
 * - 'dislike' = -0.2 (negative signal, 2x stronger than like)
 * - 'not_interested' = -0.3 (strongest negative, permanent exclusion)
 */
const FEEDBACK_WEIGHTS: Record<FeedbackType, number> = {
  love: 0.15,
  like: 0.1,
  dislike: -0.2,
  not_interested: -0.3,
};

/**
 * Normalize a vector to unit length
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(
    vector.reduce((sum, val) => sum + val * val, 0)
  );

  if (magnitude === 0) return vector;

  return vector.map(val => val / magnitude);
}

/**
 * Add two vectors element-wise
 */
function addVectors(v1: number[], v2: number[], weight: number = 1): number[] {
  return v1.map((val, i) => val + v2[i] * weight);
}

/**
 * Submit user feedback and update learned vector
 *
 * PREMIUM ONLY: Only premium users can submit feedback and update learned vector
 *
 * @param userId - User ID
 * @param appId - Steam app ID of the game
 * @param feedbackType - Type of feedback ('like', 'dislike', 'not_interested', 'love')
 * @returns Success status and updated vector
 */
export async function submitFeedback(
  userId: string,
  appId: bigint,
  feedbackType: FeedbackType
): Promise<{
  success: boolean;
  vectorUpdated: boolean;
  error?: string;
}> {
  try {
    // 1. Check if user exists
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
      },
    });

    if (!userProfile) {
      return {
        success: false,
        vectorUpdated: false,
        error: 'User profile not found',
      };
    }

    // TODO: Check premium status when we implement paid tiers
    // For now, allow everyone to use feedback features
    // const isPremium = userProfile.subscriptionTier === 'premium';
    // const isExpired = userProfile.subscriptionExpiresAt &&
    //                   new Date(userProfile.subscriptionExpiresAt) < new Date();
    // if (!isPremium || isExpired) {
    //   return {
    //     success: false,
    //     vectorUpdated: false,
    //     error: 'Premium subscription required for feedback features',
    //   };
    // }

    // 2. Get game embedding
    const gameData = await getGameWithEmbedding(appId);

    if (!gameData?.embedding) {
      return {
        success: false,
        vectorUpdated: false,
        error: 'Game not found or missing embedding',
      };
    }

    // 3. Save feedback to database (upsert - update if exists)
    await prisma.userFeedback.upsert({
      where: {
        userId_appId: {
          userId,
          appId,
        },
      },
      create: {
        userId,
        appId,
        feedbackType,
      },
      update: {
        feedbackType,
        updatedAt: new Date(),
      },
    });

    // 4. Update feedback counts
    if (feedbackType === 'like' || feedbackType === 'love') {
      await prisma.userProfile.update({
        where: { id: userId },
        data: {
          feedbackLikesCount: { increment: 1 },
        },
      });
    } else if (feedbackType === 'dislike' || feedbackType === 'not_interested') {
      await prisma.userProfile.update({
        where: { id: userId },
        data: {
          feedbackDislikesCount: { increment: 1 },
        },
      });
    }

    // 5. Update learned vector
    const success = await updateLearnedVector(userId, appId, feedbackType);

    return {
      success: true,
      vectorUpdated: success,
    };
  } catch (error) {
    console.error('Failed to submit feedback:', error);
    return {
      success: false,
      vectorUpdated: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Update user's learned vector based on feedback
 *
 * Algorithm:
 * 1. Get current learned vector (or initialize from preference vector)
 * 2. Get game embedding
 * 3. Add/subtract weighted game embedding from learned vector
 * 4. Normalize to unit length
 * 5. Save back to database
 */
async function updateLearnedVector(
  userId: string,
  appId: bigint,
  feedbackType: FeedbackType
): Promise<boolean> {
  try {
    // Get current learned vector (as text)
    const result = await prisma.$queryRaw<
      Array<{
        learned_vector: string | null;
        preference_vector: string | null;
      }>
    >`
      SELECT
        learned_vector::text as learned_vector,
        preference_vector::text as preference_vector
      FROM user_profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      console.error('User not found');
      return false;
    }

    const userData = result[0];

    // Parse learned vector or initialize from preference vector
    let learnedVector: number[];

    if (userData.learned_vector) {
      // Parse existing learned vector from '[0.1,0.2,...]' format
      learnedVector = userData.learned_vector
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);
    } else if (userData.preference_vector) {
      // Initialize learned vector from preference vector
      learnedVector = userData.preference_vector
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);
    } else {
      console.error('User has no preference vector to learn from');
      return false;
    }

    // Get game embedding
    const gameData = await getGameWithEmbedding(appId);
    if (!gameData?.embedding) {
      console.error('Game embedding not found');
      return false;
    }

    // Get feedback weight
    const weight = FEEDBACK_WEIGHTS[feedbackType];

    // Update learned vector: add/subtract weighted game embedding
    const updatedVector = addVectors(learnedVector, gameData.embedding, weight);

    // Normalize to unit length
    const normalizedVector = normalizeVector(updatedVector);

    // Save back to database
    // Format as PostgreSQL vector literal string
    const vectorString = `'[${normalizedVector.join(',')}]'`;

    await prisma.$executeRaw`
      UPDATE user_profiles
      SET
        learned_vector = ${Prisma.raw(vectorString)}::vector(1536),
        updated_at = NOW()
      WHERE id = ${userId}
    `;

    return true;
  } catch (error) {
    console.error('Failed to update learned vector:', error);
    return false;
  }
}

/**
 * Calculate hybrid recommendation vector for premium users
 *
 * Blends:
 * - 60% preference vector (from playtime)
 * - 40% learned vector (from feedback)
 *
 * This prevents overfitting to feedback while still adapting to user taste.
 */
export async function getHybridVector(
  userId: string
): Promise<number[] | null> {
  try {
    const result = await prisma.$queryRaw<
      Array<{
        preference_vector: string | null;
        learned_vector: string | null;
        subscription_tier: string;
      }>
    >`
      SELECT
        preference_vector::text as preference_vector,
        learned_vector::text as learned_vector,
        subscription_tier
      FROM user_profiles
      WHERE id = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) return null;

    const userData = result[0];

    // Parse preference vector
    if (!userData.preference_vector) {
      return null;
    }

    const preferenceVector = userData.preference_vector
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(Number);

    // TODO: For now, use hybrid vector for everyone (will restrict to premium later)
    // If no learned vector exists, return preference vector only
    if (!userData.learned_vector) {
      return preferenceVector;
    }

    // OLD CODE (when we implement premium restrictions):
    // if (userData.subscription_tier !== 'premium' || !userData.learned_vector) {
    //   return preferenceVector;
    // }

    // Parse learned vector
    const learnedVector = userData.learned_vector
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(Number);

    // Blend: 60% preference + 40% learned
    const hybridVector = preferenceVector.map(
      (val, i) => val * 0.6 + learnedVector[i] * 0.4
    );

    // Normalize
    return normalizeVector(hybridVector);
  } catch (error) {
    console.error('Failed to calculate hybrid vector:', error);
    return null;
  }
}

/**
 * Get all games marked as "not_interested" for exclusion from recommendations
 */
export async function getNotInterestedGames(
  userId: string
): Promise<bigint[]> {
  try {
    const feedback = await prisma.userFeedback.findMany({
      where: {
        userId,
        feedbackType: 'not_interested',
      },
      select: {
        appId: true,
      },
    });

    return feedback.map(f => f.appId);
  } catch (error) {
    console.error('Failed to get not interested games:', error);
    return [];
  }
}

/**
 * Delete feedback for a game (if user changes their mind)
 */
export async function deleteFeedback(
  userId: string,
  appId: bigint
): Promise<boolean> {
  try {
    await prisma.userFeedback.delete({
      where: {
        userId_appId: {
          userId,
          appId,
        },
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to delete feedback:', error);
    return false;
  }
}

/**
 * Get user's feedback history
 */
export async function getUserFeedback(
  userId: string,
  limit: number = 50
): Promise<
  Array<{
    appId: bigint;
    feedbackType: FeedbackType;
    createdAt: Date;
    gameName?: string;
  }>
> {
  try {
    const feedback = await prisma.userFeedback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        game: {
          select: {
            name: true,
          },
        },
      },
    });

    return feedback.map(f => ({
      appId: f.appId,
      feedbackType: f.feedbackType as FeedbackType,
      createdAt: f.createdAt,
      gameName: f.game.name,
    }));
  } catch (error) {
    console.error('Failed to get user feedback:', error);
    return [];
  }
}
