/**
 * Client-side API helpers for user profile and recommendations
 */

export interface IngestOptions {
  fetchAchievements?: boolean;
  recencyDecayMonths?: number;
  enableGenreDiversification?: boolean;
  minPlaytimeHours?: number;
}

export interface IngestResponse {
  success: boolean;
  userId?: string;
  steamId?: string;
  username?: string;
  avatarUrl?: string;
  gamesImported?: number;
  gamesAnalyzed?: number;
  totalPlaytimeHours?: number;
  message?: string;
  error?: string;
  details?: string;
}

export interface RecommendationFilters {
  limit?: number;
  excludeOwned?: boolean;
  minReviewScore?: number;
  minReviewCount?: number;
  releaseYearMin?: number;
  releaseYearMax?: number;
  isFree?: boolean;
  genres?: string[];
  popularityScore?: number; // 0-100: 0 = hidden gems, 50 = balanced, 100 = popular
}

export interface GameRecommendation {
  appId: string;
  name: string;
  similarity: number; // 0-1
  distance: number;
  releaseYear: number | null;
  reviewScore: number | null;
  reviewCount: number | null;
  metacriticScore: number | null;
  isFree: boolean | null;
  price?: string; // Formatted price like "$19.99" or "Free"
  priceRaw?: number; // Price in cents
  genres?: string[];
  shortDescription?: string;
  headerImage?: string;
  developers?: string[];
}

export interface RecommendationsResponse {
  success: boolean;
  userId?: string;
  steamId?: string | null;
  gamesAnalyzed?: number;
  lastUpdated?: string | null;
  recommendationCount?: number;
  recommendations?: GameRecommendation[];
  error?: string;
  details?: string;
}

/**
 * Ingest a user's Steam profile and generate preference vector
 */
export async function ingestUserProfile(
  steamInput: string,
  options?: IngestOptions
): Promise<IngestResponse> {
  try {
    const response = await fetch('/api/user/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamInput, options }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to ingest profile',
        details: data.details,
      };
    }

    return data;
  } catch (error) {
    console.error('Ingest error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get personalized recommendations for a user
 */
export async function getRecommendations(
  userId: string,
  filters?: RecommendationFilters
): Promise<RecommendationsResponse> {
  try {
    // Extract top-level params and nest the rest under 'filters'
    const { limit, excludeOwned, ...filterParams } = filters || {};
    const response = await fetch('/api/user/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        limit,
        excludeOwned,
        filters: filterParams,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get recommendations',
        details: data.details,
      };
    }

    return data;
  } catch (error) {
    console.error('Recommendations error:', error);
    return {
      success: false,
      error: 'Network error. Please check your connection and try again.',
      details: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Error message mapping for common errors
 */
export const ERROR_MESSAGES = {
  PRIVATE_PROFILE:
    'Your Steam profile is private. Please set your Game Details to Public in your Steam Privacy Settings.',
  NO_GAMES:
    "We couldn't find any games in your library. Make sure your profile is public and you own games.",
  INVALID_STEAM_ID:
    'Invalid Steam ID or profile URL. Try your 17-digit Steam ID, profile URL, or custom URL.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again in a moment.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  NO_PREFERENCE_VECTOR:
    'User has no preference vector. Please analyze your profile first.',
  PROFILE_NOT_FOUND: 'User profile not found. Please try ingesting your profile again.',
  STEAM_API_KEY_MISSING:
    'Steam API key not configured. Please contact support.',
};

/**
 * Get a user-friendly error message
 */
export function getFriendlyErrorMessage(error: string): string {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('private')) {
    return ERROR_MESSAGES.PRIVATE_PROFILE;
  }
  if (lowerError.includes('no games')) {
    return ERROR_MESSAGES.NO_GAMES;
  }
  if (lowerError.includes('invalid') || lowerError.includes('not found')) {
    return ERROR_MESSAGES.INVALID_STEAM_ID;
  }
  if (lowerError.includes('steam api key')) {
    return ERROR_MESSAGES.STEAM_API_KEY_MISSING;
  }
  if (lowerError.includes('preference vector')) {
    return ERROR_MESSAGES.NO_PREFERENCE_VECTOR;
  }
  if (lowerError.includes('profile not found')) {
    return ERROR_MESSAGES.PROFILE_NOT_FOUND;
  }
  if (lowerError.includes('network')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return error || ERROR_MESSAGES.SERVER_ERROR;
}

/**
 * Feedback System API (PREMIUM ONLY)
 */

export type FeedbackType = 'like' | 'dislike' | 'not_interested' | 'love';

export interface FeedbackResponse {
  success: boolean;
  vectorUpdated?: boolean;
  message?: string;
  error?: string;
  requiresPremium?: boolean;
}

export interface SubscriptionStatus {
  success: boolean;
  tier: string;
  isPremium: boolean;
  expiresAt: string | null;
  daysRemaining: number;
  isExpired: boolean;
  features: {
    unlimitedResults: boolean;
    feedbackLearning: boolean;
    advancedFilters: boolean;
    notInterestedList: boolean;
  };
  stats: {
    feedbackLikesCount: number;
    feedbackDislikesCount: number;
    totalFeedback: number;
  };
}

/**
 * Submit feedback on a game (PREMIUM ONLY)
 */
export async function submitFeedback(
  userId: string,
  appId: string,
  feedbackType: FeedbackType
): Promise<FeedbackResponse> {
  try {
    const response = await fetch('/api/user/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        appId: parseInt(appId),
        feedbackType,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to submit feedback',
        requiresPremium: data.requiresPremium,
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get subscription status
 */
export async function getSubscriptionStatus(
  userId: string
): Promise<SubscriptionStatus | null> {
  try {
    const response = await fetch(`/api/user/subscription?userId=${userId}`);

    if (!response.ok) {
      console.error('Failed to fetch subscription status');
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return null;
  }
}

/**
 * Update subscription (for testing/admin)
 */
export async function updateSubscription(
  userId: string,
  tier: 'free' | 'premium',
  expiresAt?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/user/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tier, expiresAt }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to update subscription',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
