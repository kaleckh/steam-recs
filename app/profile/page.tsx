'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import ChatPrompt from '@/components/profile/ChatPrompt';
import AlgorithmAccuracy from '@/components/profile/AlgorithmAccuracy';

// LocalStorage keys
const STORAGE_KEYS = {
  USER_ID: 'steamRecUserId',
  STEAM_ID: 'steamRecSteamId',
  LAST_UPDATED: 'steamRecLastUpdated',
  GAMES_ANALYZED: 'steamRecGamesAnalyzed',
  TOTAL_PLAYTIME: 'steamRecTotalPlaytime',
  RATINGS_COUNT: 'steamRecRatingsCount',
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
  const router = useRouter();
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
  const [ratingsCount, setRatingsCount] = useState(0);
  const [topGames, setTopGames] = useState<Array<{
    appId: string;
    name: string;
    playtimeHours: number;
    headerImage?: string;
  }>>([]);

  // Check for existing session on mount
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const savedSteamId = localStorage.getItem(STORAGE_KEYS.STEAM_ID);
    const steamIdParam = searchParams.get('steamId');

    // Load ratings count from localStorage
    const savedRatingsCount = parseInt(localStorage.getItem(STORAGE_KEYS.RATINGS_COUNT) || '0');
    setRatingsCount(savedRatingsCount);

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

      // Fetch top games
      fetchTopGames(userId);
    } else {
      setState({
        stage: 'error',
        error: getFriendlyErrorMessage(
          result.error || 'Failed to load recommendations'
        ),
      });
    }
  };

  // Fetch user's top played games
  const fetchTopGames = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/top-games?userId=${userId}&limit=5`);
      const data = await response.json();

      if (data.success && data.games) {
        setTopGames(data.games);
      }
    } catch (error) {
      console.error('Failed to fetch top games:', error);
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

        // Fetch top games
        fetchTopGames(result.userId);
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

  // Handle semantic search query from ChatPrompt
  const handleChatQuery = (query: string) => {
    // Navigate to search page with query
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  // Handle rating submitted - increment count in state and localStorage
  const handleRatingSubmitted = () => {
    const newCount = ratingsCount + 1;
    setRatingsCount(newCount);
    localStorage.setItem(STORAGE_KEYS.RATINGS_COUNT, String(newCount));
  };

  // Render based on state
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Your Personalized Recommendations
          </h1>
          <p className="text-lg text-gray-500">
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
            {/* User Profile Info */}
            <div className="flex justify-center">
              <div className="bg-white rounded-2xl shadow-sm px-8 py-6 border border-gray-100 w-full max-w-6xl">
                <div className="flex items-start justify-between mb-6">
                  {/* Left: User Info */}
                  <div className="flex items-center gap-4">
                    {/* Steam Avatar Placeholder - TODO: fetch from Steam API */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {state.steamId.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Steam User
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {state.gamesAnalyzed} games • {state.totalPlaytimeHours ? `${Math.round(state.totalPlaytimeHours).toLocaleString()} hours` : 'analyzing...'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Updated {state.lastUpdated.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Right: Update Button */}
                  <button
                    onClick={handleUpdateProfile}
                    className="bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-6 rounded-xl shadow-sm hover:shadow-md transform hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Update Profile
                  </button>
                </div>

                {/* Top Games */}
                {topGames.length > 0 && (
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Most Played Games</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {topGames.map((game) => (
                        <a
                          key={game.appId}
                          href={`https://store.steampowered.com/app/${game.appId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative"
                        >
                          <div className="aspect-[460/215] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg transition-all">
                            {game.headerImage ? (
                              <img
                                src={game.headerImage}
                                alt={game.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{game.name}</p>
                            <p className="text-xs text-gray-500">{game.playtimeHours.toLocaleString()} hrs</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Algorithm Accuracy & Chat Prompt */}
            <div className="grid md:grid-cols-2 gap-6">
              <AlgorithmAccuracy
                ratingsCount={ratingsCount}
                gamesAnalyzed={state.gamesAnalyzed}
                userId={state.userId}
              />
              <ChatPrompt
                onSubmit={handleChatQuery}
                isLoading={false}
              />
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
                onRatingSubmitted={handleRatingSubmitted}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
