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
import { ProfileTab } from '@/components/navigation/TopNav';
import ForYouTab from '@/components/profile/tabs/ForYouTab';
import AISearchTab from '@/components/profile/tabs/AISearchTab';
import AnalyticsTab from '@/components/profile/tabs/AnalyticsTab';
import LibraryTab from '@/components/profile/tabs/LibraryTab';

// LocalStorage keys
const STORAGE_KEYS = {
  USER_ID: 'steamRecUserId',
  STEAM_ID: 'steamRecSteamId',
  USERNAME: 'steamRecUsername',
  AVATAR_URL: 'steamRecAvatarUrl',
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
  const searchParams = useSearchParams();
  const [state, setState] = useState<ProfileState>({ stage: 'input' });
  const [filters, setFilters] = useState<RecommendationFilters>({
    limit: 20,
    excludeOwned: true,
    minReviewScore: 0,
    popularityScore: 50,
  });
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [ratingsCount, setRatingsCount] = useState(0);
  const [topGames, setTopGames] = useState<Array<{
    appId: string;
    name: string;
    playtimeHours: number;
    headerImage?: string;
  }>>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Get active tab from URL params
  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab = (tabParam === 'ai-search' || tabParam === 'analytics' || tabParam === 'library')
    ? tabParam
    : 'for-you';

  // Check for existing session on mount
  useEffect(() => {
    const initializePage = async () => {
      const savedUserId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const savedSteamId = localStorage.getItem(STORAGE_KEYS.STEAM_ID);
      const steamIdParam = searchParams.get('steamId');

      const savedRatingsCount = parseInt(localStorage.getItem(STORAGE_KEYS.RATINGS_COUNT) || '0');
      setRatingsCount(savedRatingsCount);

      const savedUsername = localStorage.getItem(STORAGE_KEYS.USERNAME);
      const savedAvatarUrl = localStorage.getItem(STORAGE_KEYS.AVATAR_URL);
      if (savedUsername) setUsername(savedUsername);
      if (savedAvatarUrl) setAvatarUrl(savedAvatarUrl);

      if (steamIdParam) {
        setIsInitializing(false);
        handleIngest(steamIdParam);
      } else if (savedUserId && savedSteamId) {
        await loadSavedProfile(savedUserId, savedSteamId);
        setIsInitializing(false);
      } else {
        setIsInitializing(false);
      }
    };

    initializePage();
  }, [searchParams]);

  const loadSavedProfile = async (userId: string, steamId: string) => {
    setState({ stage: 'loading_recommendations', userId, steamId });

    const [result, topGamesData] = await Promise.all([
      getRecommendations(userId, filters),
      fetchTopGamesData(userId),
      new Promise(resolve => setTimeout(resolve, 500))
    ]);

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

      if (topGamesData) {
        setTopGames(topGamesData);
      }

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

  const fetchTopGamesData = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/top-games?userId=${userId}&limit=5`);
      const data = await response.json();

      if (data.success && data.games) {
        return data.games;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch top games:', error);
      return null;
    }
  };

  const fetchTopGames = async (userId: string) => {
    const games = await fetchTopGamesData(userId);
    if (games) {
      setTopGames(games);
    }
  };

  const handleIngest = async (steamInput: string) => {
    setState({ stage: 'ingesting', steamInput });

    const result = await ingestUserProfile(steamInput);

    if (result.success && result.userId && result.steamId) {
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
      if (result.username) {
        localStorage.setItem(STORAGE_KEYS.USERNAME, result.username);
        setUsername(result.username);
      }
      if (result.avatarUrl) {
        localStorage.setItem(STORAGE_KEYS.AVATAR_URL, result.avatarUrl);
        setAvatarUrl(result.avatarUrl);
      }

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

  const handleFilterChange = async (newFilters: RecommendationFilters) => {
    setFilters(newFilters);
    setIsApplyingFilters(true);

    if (state.stage === 'recommendations') {
      const [result] = await Promise.all([
        getRecommendations(state.userId, newFilters),
        new Promise(resolve => setTimeout(resolve, 500))
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
  };

  const handleUpdateProfile = () => {
    if (state.stage === 'recommendations') {
      handleIngest(state.steamId);
    }
  };

  const handleRetry = () => {
    setState({ stage: 'input' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 pb-32 grid-pattern relative">
      {/* CRT Effects */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-block mb-4">
            <span className="pixel-font text-xs text-neon-orange tracking-widest uppercase">
              // SYSTEM ONLINE
            </span>
          </div>
          <h1 className="orbitron text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 tracking-tight">
            <span className="text-neon-cyan glow-cyan">STEAM</span>{' '}
            <span className="text-neon-orange glow-magenta">RECOMMENDER</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-400 font-mono max-w-2xl mx-auto">
            <span className="text-neon-green">&gt;</span> AI-powered game recommendations based on your playtime data
          </p>
        </div>

        {/* Initial Loading State */}
        {isInitializing && (
          <div className="flex justify-center py-12">
            <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
              </div>
              <p className="text-neon-cyan font-mono cursor-blink">INITIALIZING</p>
            </div>
          </div>
        )}

        {/* State-based Rendering */}
        {!isInitializing && state.stage === 'input' && (
          <SteamInput onSubmit={handleIngest} isLoading={false} />
        )}

        {!isInitializing && state.stage === 'ingesting' && (
          <LoadingState steamId={state.steamInput} />
        )}

        {!isInitializing && state.stage === 'loading_recommendations' && (
          <div className="space-y-8">
            {/* Profile Skeleton - hidden on AI Search tab */}
            {activeTab !== 'ai-search' && (
              <div className="flex justify-center">
                <div className="terminal-box rounded-lg w-full max-w-6xl overflow-hidden">
                  <div className="terminal-header">
                    <span className="text-gray-400 text-sm font-mono ml-16">USER_PROFILE.exe</span>
                  </div>
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-terminal-light animate-pulse rounded-lg border-2 border-terminal-border" />
                        <div className="space-y-3">
                          <div className="h-7 w-40 bg-terminal-light rounded animate-pulse" />
                          <div className="h-4 w-56 bg-terminal-light rounded animate-pulse" />
                          <div className="h-3 w-32 bg-terminal-light rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="h-12 w-44 bg-terminal-light rounded animate-pulse" />
                    </div>

                    <div className="border-t border-terminal-border pt-6">
                      <div className="h-4 w-48 bg-terminal-light rounded mb-4 animate-pulse" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="space-y-2">
                            <div className="aspect-[460/215] bg-terminal-light rounded animate-pulse" />
                            <div className="h-3 bg-terminal-light rounded animate-pulse" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Spinner */}
            <div className="flex justify-center py-12">
              <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
                </div>
                <p className="text-neon-cyan font-mono">LOADING RECOMMENDATIONS...</p>
              </div>
            </div>
          </div>
        )}

        {!isInitializing && state.stage === 'error' && (
          <ErrorDisplay error={state.error} onRetry={handleRetry} />
        )}

        {!isInitializing && state.stage === 'recommendations' && (
          <div className="space-y-8 stagger-children">
            {/* User Profile Card - hidden on AI Search tab */}
            {activeTab !== 'ai-search' && (
            <div className="flex justify-center">
              <div className="terminal-box rounded-lg w-full max-w-6xl overflow-hidden">
                <div className="terminal-header">
                  <span className="text-gray-400 text-sm font-mono ml-16">USER_PROFILE.exe</span>
                </div>
                <div className="p-8">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-8">
                    {/* User Info */}
                    <div className="flex items-center gap-6">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt={username || 'Steam User'}
                          className="w-20 h-20 rounded-lg border-2 border-neon-cyan box-glow-cyan"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border-2 border-neon-cyan flex items-center justify-center box-glow-cyan">
                          <span className="orbitron text-3xl font-bold text-neon-cyan">
                            {(username || state.steamId).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="orbitron text-2xl font-bold text-white mb-2">
                          {username || 'STEAM USER'}
                        </h2>
                        <div className="flex flex-wrap gap-4 text-sm font-mono">
                          <span className="text-neon-green">
                            <span className="text-gray-500">[</span>
                            {state.gamesAnalyzed} GAMES
                            <span className="text-gray-500">]</span>
                          </span>
                          {state.totalPlaytimeHours && (
                            <span className="text-neon-orange">
                              <span className="text-gray-500">[</span>
                              {Math.round(state.totalPlaytimeHours).toLocaleString()} HRS
                              <span className="text-gray-500">]</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2 font-mono">
                          LAST SYNC: {state.lastUpdated.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Update Button */}
                    <button
                      onClick={handleUpdateProfile}
                      className="btn-arcade rounded-lg flex items-center gap-3"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      RESYNC
                    </button>
                  </div>

                  {/* Top Games */}
                  {topGames.length > 0 && (
                    <div className="border-t border-terminal-border pt-6">
                      <h3 className="text-xs font-mono text-neon-cyan uppercase tracking-widest mb-4">
                        <span className="text-gray-500">&gt;</span> MOST_PLAYED.log
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                        {topGames.map((game) => (
                          <a
                            key={game.appId}
                            href={`/game/${game.appId}`}
                            className="group relative"
                          >
                            <div className="aspect-video bg-terminal-dark rounded-lg overflow-hidden border border-terminal-border group-hover:border-neon-cyan transition-all">
                              {game.headerImage ? (
                                <img
                                  src={game.headerImage}
                                  alt={game.name}
                                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-terminal-border">
                                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="mt-2">
                              <p className="text-xs font-mono text-gray-300 line-clamp-1 group-hover:text-neon-cyan transition-colors">
                                {game.name}
                              </p>
                              <p className="text-xs text-neon-green font-mono">
                                {game.playtimeHours.toLocaleString()}h
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

            {/* Tab Content */}
            {activeTab === 'for-you' && (
              <ForYouTab
                userId={state.userId}
                recommendations={state.recommendations}
                gamesAnalyzed={state.gamesAnalyzed}
                ratingsCount={ratingsCount}
                filters={filters}
                onFilterChange={handleFilterChange}
                isApplyingFilters={isApplyingFilters}
              />
            )}

            {activeTab === 'ai-search' && (
              <AISearchTab userId={state.userId} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                userId={state.userId}
                gamesAnalyzed={state.gamesAnalyzed}
                totalPlaytimeHours={state.totalPlaytimeHours}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab userId={state.userId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
