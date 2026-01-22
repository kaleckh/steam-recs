'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ingestUserProfile,
  getRecommendations,
  getFriendlyErrorMessage,
  GameRecommendation,
  RecommendationFilters,
} from '@/lib/api-client';
import SteamInput from '@/components/profile/SteamInput';
import LoadingState from '@/components/profile/LoadingState';
import ErrorDisplay from '@/components/profile/ErrorDisplay';
import RecommendationsList from '@/components/profile/RecommendationsList';
import FilterControls from '@/components/profile/FilterControls';

// LocalStorage keys
const STORAGE_KEYS = {
  USER_ID: 'steamRecUserId',
  STEAM_ID: 'steamRecSteamId',
  LAST_UPDATED: 'steamRecLastUpdated',
  GAMES_ANALYZED: 'steamRecGamesAnalyzed',
  TOTAL_PLAYTIME: 'steamRecTotalPlaytime',
};

type ProfileState =
  | { stage: 'input' }
  | { stage: 'ingesting'; steamInput: string }
  | { stage: 'loading_recommendations'; userId: string; steamId: string }
  | {
      stage: 'recommendations';
      userId: string;
      steamId: string;
      recommendations: GameRecommendation[];
      gamesAnalyzed: number;
      totalPlaytimeHours?: number;
      lastUpdated: Date;
    }
  | { stage: 'error'; error: string };

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProfileState>({ stage: 'input' });
  const [filters, setFilters] = useState<RecommendationFilters>({
    limit: 20,
    excludeOwned: true,
    minReviewScore: 0,
    popularityScore: 50, // Default: balanced
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const savedSteamId = localStorage.getItem(STORAGE_KEYS.STEAM_ID);
    const steamIdParam = searchParams.get('steamId');

    if (steamIdParam) {
      // If Steam ID in URL, start ingestion
      handleIngest(steamIdParam);
    } else if (savedUserId && savedSteamId) {
      // If saved session exists, load recommendations
      loadSavedProfile(savedUserId, savedSteamId);
    }
  }, [searchParams]);

  // Load saved profile and fetch recommendations
  const loadSavedProfile = async (userId: string, steamId: string) => {
    setState({ stage: 'loading_recommendations', userId, steamId });

    const result = await getRecommendations(userId, filters);

    if (result.success && result.recommendations) {
      const gamesAnalyzed =
        result.gamesAnalyzed ||
        parseInt(localStorage.getItem(STORAGE_KEYS.GAMES_ANALYZED) || '0');
      const totalPlaytimeHours = parseFloat(
        localStorage.getItem(STORAGE_KEYS.TOTAL_PLAYTIME) || '0'
      );
      const lastUpdatedStr = localStorage.getItem(STORAGE_KEYS.LAST_UPDATED);
      const lastUpdated = lastUpdatedStr
        ? new Date(lastUpdatedStr)
        : new Date();

      setState({
        stage: 'recommendations',
        userId,
        steamId,
        recommendations: result.recommendations,
        gamesAnalyzed,
        totalPlaytimeHours,
        lastUpdated,
      });
    } else {
      setState({
        stage: 'error',
        error: getFriendlyErrorMessage(
          result.error || 'Failed to load recommendations'
        ),
      });
    }
  };

  // Handle Steam profile ingestion
  const handleIngest = async (steamInput: string) => {
    setState({ stage: 'ingesting', steamInput });

    const result = await ingestUserProfile(steamInput);

    if (result.success && result.userId && result.steamId) {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEYS.USER_ID, result.userId);
      localStorage.setItem(STORAGE_KEYS.STEAM_ID, result.steamId);
      localStorage.setItem(STORAGE_KEYS.LAST_UPDATED, new Date().toISOString());
      localStorage.setItem(
        STORAGE_KEYS.GAMES_ANALYZED,
        String(result.gamesAnalyzed || 0)
      );
      localStorage.setItem(
        STORAGE_KEYS.TOTAL_PLAYTIME,
        String(result.totalPlaytimeHours || 0)
      );

      // Fetch recommendations
      setState({
        stage: 'loading_recommendations',
        userId: result.userId,
        steamId: result.steamId,
      });

      const recsResult = await getRecommendations(result.userId, filters);

      if (recsResult.success && recsResult.recommendations) {
        setState({
          stage: 'recommendations',
          userId: result.userId,
          steamId: result.steamId,
          recommendations: recsResult.recommendations,
          gamesAnalyzed: result.gamesAnalyzed || 0,
          totalPlaytimeHours: result.totalPlaytimeHours,
          lastUpdated: new Date(),
        });
      } else {
        setState({
          stage: 'error',
          error: getFriendlyErrorMessage(
            recsResult.error || 'Failed to get recommendations'
          ),
        });
      }
    } else {
      setState({
        stage: 'error',
        error: getFriendlyErrorMessage(
          result.error || 'Failed to ingest profile'
        ),
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = async (newFilters: RecommendationFilters) => {
    setFilters(newFilters);
    setIsApplyingFilters(true);

    if (state.stage === 'recommendations') {
      // Start both the API call and minimum delay
      const [result] = await Promise.all([
        getRecommendations(state.userId, newFilters),
        new Promise(resolve => setTimeout(resolve, 500)) // Minimum 500ms
      ]);

      if (result.success && result.recommendations) {
        setState({
          stage: 'recommendations',
          userId: state.userId,
          steamId: state.steamId,
          recommendations: result.recommendations,
          gamesAnalyzed: state.gamesAnalyzed,
          totalPlaytimeHours: state.totalPlaytimeHours,
          lastUpdated: state.lastUpdated,
        });
      } else {
        setState({
          stage: 'error',
          error: getFriendlyErrorMessage(
            result.error || 'Failed to update recommendations'
          ),
        });
      }
    }

    setIsApplyingFilters(false);
    setIsFilterExpanded(false); // Close the filter menu
  };

  // Handle profile update (re-ingest)
  const handleUpdateProfile = () => {
    if (state.stage === 'recommendations') {
      handleIngest(state.steamId);
    }
  };

  // Handle retry after error
  const handleRetry = () => {
    setState({ stage: 'input' });
  };

  // Render based on state
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Personalized Game Recommendations
          </h1>
          <p className="text-lg text-gray-600">
            Powered by AI analysis of your Steam profile and playtime
          </p>
        </div>

        {/* State-based Rendering */}
        {state.stage === 'input' && (
          <SteamInput onSubmit={handleIngest} isLoading={false} />
        )}

        {state.stage === 'ingesting' && (
          <LoadingState steamId={state.steamInput} />
        )}

        {state.stage === 'loading_recommendations' && (
          <LoadingState steamId={state.steamId} />
        )}

        {state.stage === 'error' && (
          <ErrorDisplay error={state.error} onRetry={handleRetry} />
        )}

        {state.stage === 'recommendations' && (
          <div className="space-y-8">
            {/* Update Profile Button */}
            <div className="flex justify-center">
              <div className="bg-white rounded-xl shadow-lg px-6 py-4 border border-gray-200 flex items-center justify-between space-x-6">
                <div className="text-sm text-gray-600">
                  <strong>Steam ID:</strong> {state.steamId}
                  <span className="mx-3">•</span>
                  <strong>Last Updated:</strong>{' '}
                  {state.lastUpdated.toLocaleDateString()}
                </div>
                <button
                  onClick={handleUpdateProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg shadow hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
                >
                  Update Profile
                </button>
              </div>
            </div>

            {/* Filters */}
            <FilterControls
              onFilterChange={handleFilterChange}
              isLoading={isApplyingFilters}
              isExpanded={isFilterExpanded}
              onToggleExpanded={setIsFilterExpanded}
              currentFilters={filters}
            />

            {/* Loading Spinner for Filter Changes */}
            {isApplyingFilters && (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center space-y-4">
                  <svg
                    className="animate-spin h-12 w-12 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <p className="text-gray-600 font-medium">Updating recommendations...</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            {!isApplyingFilters && (
              <RecommendationsList
                recommendations={state.recommendations}
                gamesAnalyzed={state.gamesAnalyzed}
                totalPlaytimeHours={state.totalPlaytimeHours}
                userId={state.userId}
                isPremium={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
