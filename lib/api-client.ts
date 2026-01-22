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
    const response = await fetch('/api/user/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...filters }),
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
