'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
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
import UpgradeModal from '@/components/premium/UpgradeModal';
import { useAuth } from '@/contexts/AuthContext';

type ProfileState =
  | { stage: 'loading' }
  | { stage: 'link_steam' }
  | { stage: 'ingesting'; steamInput: string }
  | { stage: 'loading_recommendations' }
  | {
      stage: 'recommendations';
      recommendations: GameRecommendation[];
      gamesAnalyzed: number;
      totalPlaytimeHours?: number;
      lastUpdated: Date;
    }
  | { stage: 'error'; error: string };

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { profile, isPremium, isLoading: authLoading, refreshProfile } = useAuth();

  const [state, setState] = useState<ProfileState>({ stage: 'loading' });
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
  const [username, setUsername] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Get active tab from URL params
  const tabParam = searchParams.get('tab');
  const activeTab: ProfileTab = (tabParam === 'ai-search' || tabParam === 'analytics' || tabParam === 'library')
    ? tabParam
    : 'for-you';

  const fetchTopGamesData = useCallback(async (userId: string) => {
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
  }, []);

  const loadRecommendations = useCallback(async () => {
    if (!profile?.id) return;

    setState({ stage: 'loading_recommendations' });

    try {
      const [result, topGamesData, feedbackData] = await Promise.all([
        getRecommendations(profile.id, filters),
        fetchTopGamesData(profile.id),
        fetch(`/api/user/feedback?userId=${profile.id}`).then(r => r.json()).catch(() => null),
      ]);

      if (feedbackData?.feedback) {
        setRatingsCount(feedbackData.feedback.length);
      }

      if (topGamesData) {
        setTopGames(topGamesData);
      }

      if (result.success && result.recommendations) {
        setState({
          stage: 'recommendations',
          recommendations: result.recommendations,
          gamesAnalyzed: profile.gamesAnalyzed || 0,
          totalPlaytimeHours: profile.totalPlaytimeHours,
          lastUpdated: new Date(),
        });
      } else {
        setState({
          stage: 'error',
          error: getFriendlyErrorMessage(result.error || 'Failed to load recommendations'),
        });
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setState({
        stage: 'error',
        error: 'Failed to load recommendations. Please try again.',
      });
    }
  }, [profile?.id, profile?.gamesAnalyzed, profile?.totalPlaytimeHours, filters, fetchTopGamesData]);

  // Initialize page based on auth state
  useEffect(() => {
    if (authLoading) {
      setState({ stage: 'loading' });
      return;
    }

    if (!profile) {
      setState({ stage: 'loading' });
      return;
    }

    // If user has Steam linked, load recommendations
    if (profile.steamId) {
      loadRecommendations();
    } else {
      // User needs to link Steam account
      setState({ stage: 'link_steam' });
    }
  }, [authLoading, profile, loadRecommendations]);

  const handleLinkSteam = async (steamInput: string) => {
    if (!profile?.id) return;

    setState({ stage: 'ingesting', steamInput });

    try {
      // Call the ingest API to link Steam and fetch games
      const response = await fetch('/api/user/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamInput }),
      });

      const result = await response.json();

      if (result.success) {
        // Update username and avatar
        if (result.username) setUsername(result.username);
        if (result.avatarUrl) setAvatarUrl(result.avatarUrl);

        // Refresh the profile to get updated steamId
        await refreshProfile();

        // Load recommendations
        setState({ stage: 'loading_recommendations' });

        const recsResult = await getRecommendations(result.userId, filters);

        if (recsResult.success && recsResult.recommendations) {
          // Fetch top games
          const topGamesData = await fetchTopGamesData(result.userId);
          if (topGamesData) setTopGames(topGamesData);

          setState({
            stage: 'recommendations',
            recommendations: recsResult.recommendations,
            gamesAnalyzed: result.gamesAnalyzed || 0,
            totalPlaytimeHours: result.totalPlaytimeHours,
            lastUpdated: new Date(),
          });
        } else {
          setState({
            stage: 'error',
            error: getFriendlyErrorMessage(recsResult.error || 'Failed to get recommendations'),
          });
        }
      } else {
        setState({
          stage: 'error',
          error: getFriendlyErrorMessage(result.error || 'Failed to link Steam account'),
        });
      }
    } catch (error) {
      console.error('Failed to link Steam:', error);
      setState({
        stage: 'error',
        error: 'Failed to link Steam account. Please try again.',
      });
    }
  };

  const handleFilterChange = async (newFilters: RecommendationFilters) => {
    if (!profile?.id) return;

    setFilters(newFilters);
    setIsApplyingFilters(true);

    if (state.stage === 'recommendations') {
      try {
        const [result] = await Promise.all([
          getRecommendations(profile.id, newFilters),
          new Promise(resolve => setTimeout(resolve, 500)),
        ]);

        if (result.success && result.recommendations) {
          setState({
            stage: 'recommendations',
            recommendations: result.recommendations,
            gamesAnalyzed: state.gamesAnalyzed,
            totalPlaytimeHours: state.totalPlaytimeHours,
            lastUpdated: state.lastUpdated,
          });
        } else {
          setState({
            stage: 'error',
            error: getFriendlyErrorMessage(result.error || 'Failed to update recommendations'),
          });
        }
      } catch (error) {
        console.error('Failed to apply filters:', error);
      }
    }

    setIsApplyingFilters(false);
  };

  const handleResync = async () => {
    if (!profile?.steamId) return;
    handleLinkSteam(profile.steamId);
  };

  const handleRetry = () => {
    if (profile?.steamId) {
      loadRecommendations();
    } else {
      setState({ stage: 'link_steam' });
    }
  };

  // Show loading while auth is initializing
  if (authLoading || state.stage === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 sm:px-6 lg:px-8 pb-32 grid-pattern relative">
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex justify-center py-24">
            <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
              </div>
              <p className="text-neon-cyan font-mono cursor-blink">INITIALIZING</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Link Steam Account */}
        {state.stage === 'link_steam' && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <p className="text-gray-400 font-mono">
                Link your Steam account to get personalized recommendations
              </p>
            </div>
            <SteamInput onSubmit={handleLinkSteam} isLoading={false} />
          </div>
        )}

        {/* Ingesting Steam Data */}
        {state.stage === 'ingesting' && (
          <LoadingState steamId={state.steamInput} />
        )}

        {/* Loading Recommendations */}
        {state.stage === 'loading_recommendations' && (
          <div className="space-y-8">
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
                  </div>
                </div>
              </div>
            )}

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

        {/* Error State */}
        {state.stage === 'error' && (
          <ErrorDisplay error={state.error} onRetry={handleRetry} />
        )}

        {/* Recommendations */}
        {state.stage === 'recommendations' && profile && (
          <div className="space-y-8 stagger-children">
            {/* User Profile Card */}
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
                              {(username || profile.email || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h2 className="orbitron text-2xl font-bold text-white mb-2">
                            {username || profile.email?.split('@')[0] || 'PLAYER'}
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

                      {/* Resync Button */}
                      <button
                        onClick={() => isPremium ? handleResync() : setIsUpgradeModalOpen(true)}
                        className="btn-arcade rounded-lg flex items-center gap-3"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        RESYNC
                        {!isPremium && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                            PRO
                          </span>
                        )}
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
                userId={profile.id}
                recommendations={state.recommendations}
                gamesAnalyzed={state.gamesAnalyzed}
                ratingsCount={ratingsCount}
                filters={filters}
                onFilterChange={handleFilterChange}
                isApplyingFilters={isApplyingFilters}
                isPremium={isPremium}
              />
            )}

            {activeTab === 'ai-search' && (
              <AISearchTab userId={profile.id} isPremium={isPremium} />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsTab
                userId={profile.id}
                gamesAnalyzed={state.gamesAnalyzed}
                totalPlaytimeHours={state.totalPlaytimeHours}
                isPremium={isPremium}
              />
            )}

            {activeTab === 'library' && (
              <LibraryTab userId={profile.id} />
            )}
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      {profile && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          userId={profile.id}
        />
      )}
    </div>
  );
}
