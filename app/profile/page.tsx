'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getRecommendations,
  getFriendlyErrorMessage,
  GameRecommendation,
  RecommendationFilters,
} from '@/lib/api-client';
import SteamInput from '@/components/profile/SteamInput';
import LoadingState from '@/components/profile/LoadingState';
import ErrorDisplay from '@/components/profile/ErrorDisplay';
import AnalyticsTab from '@/components/profile/tabs/AnalyticsTab';
import UpgradeModal from '@/components/premium/UpgradeModal';
import TasteDNA from '@/components/profile/TasteDNA';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useAuth, CachedRecommendations } from '@/contexts/AuthContext';

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

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, isPremium, isLoading: authLoading, refreshProfile, cachedRecommendations, setCachedRecommendations, signOut } = useAuth();

  const [state, setState] = useState<ProfileState>({ stage: 'loading' });
  const [filters] = useState<RecommendationFilters>({
    limit: 20,
    excludeOwned: true,
    minReviewScore: 0,
    popularityScore: 50,
  });
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
  const [isResetTasteModalOpen, setIsResetTasteModalOpen] = useState(false);
  const [isResettingTaste, setIsResettingTaste] = useState(false);

  // Get active tab from URL params (only analytics tab remains on profile page)
  const tabParam = searchParams.get('tab');
  const showAnalytics = tabParam === 'analytics';

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

  const loadRecommendations = useCallback(async (forceRefresh = false) => {
    if (!profile?.id) return;

    // Use cached data if available and not forcing refresh
    if (!forceRefresh && cachedRecommendations) {
      if (cachedRecommendations.topGames) {
        setTopGames(cachedRecommendations.topGames as typeof topGames);
      }
      if (cachedRecommendations.ratingsCount !== undefined) {
        setRatingsCount(cachedRecommendations.ratingsCount);
      }
      setState({
        stage: 'recommendations',
        recommendations: cachedRecommendations.recommendations as GameRecommendation[],
        gamesAnalyzed: cachedRecommendations.gamesAnalyzed,
        totalPlaytimeHours: cachedRecommendations.totalPlaytimeHours,
        lastUpdated: cachedRecommendations.lastUpdated,
      });
      return;
    }

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
        const newCache: CachedRecommendations = {
          recommendations: result.recommendations,
          gamesAnalyzed: profile.gamesAnalyzed || 0,
          totalPlaytimeHours: profile.totalPlaytimeHours,
          lastUpdated: new Date(),
          topGames: topGamesData || undefined,
          ratingsCount: feedbackData?.feedback?.length,
        };
        setCachedRecommendations(newCache);

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
  }, [profile?.id, profile?.gamesAnalyzed, profile?.totalPlaytimeHours, filters, fetchTopGamesData, cachedRecommendations, setCachedRecommendations]);

  // Check for pending search from landing page and redirect
  useEffect(() => {
    const pendingSearch = sessionStorage.getItem('pendingSearch');
    if (pendingSearch) {
      sessionStorage.removeItem('pendingSearch');
      router.replace(`/search?q=${encodeURIComponent(pendingSearch)}`);
    }
  }, [router]);

  // Initialize page based on auth state
  useEffect(() => {
    if (authLoading) {
      setState({ stage: 'loading' });
      return;
    }

    // Auth is done loading - check if we have a profile
    if (!profile) {
      // If we have a user but no profile, show the link steam form
      // This handles the case where profile creation failed or was deleted
      if (user) {
        setState({ stage: 'link_steam' });
      } else {
        // No user means they need to log in - redirect handled by middleware
        setState({ stage: 'loading' });
      }
      return;
    }

    // If user has Steam linked, load recommendations
    if (profile.steamId) {
      loadRecommendations();
    } else {
      // User needs to link Steam account
      setState({ stage: 'link_steam' });
    }
  }, [authLoading, profile, user, loadRecommendations]);

  const handleLinkSteam = async (steamInput: string) => {
    // Allow linking even without existing profile - ingest API will create one
    if (!user) return;

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

  const handleResync = async () => {
    if (!profile?.steamId) return;
    // Clear cache on resync
    setCachedRecommendations(null);
    handleLinkSteam(profile.steamId);
  };

  const handleResetTaste = async (clearHistory: boolean) => {
    setIsResettingTaste(true);
    try {
      const response = await fetch('/api/user/reset-taste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearFeedbackHistory: clearHistory }),
      });

      const data = await response.json();

      if (data.success) {
        // Clear cached recommendations to force refresh
        setCachedRecommendations(null);
        // Reset ratings count if history was cleared
        if (clearHistory) {
          setRatingsCount(0);
        }
        // Reload recommendations
        loadRecommendations(true);
        setIsResetTasteModalOpen(false);
      } else {
        console.error('Failed to reset taste:', data.error);
      }
    } catch (error) {
      console.error('Failed to reset taste:', error);
    } finally {
      setIsResettingTaste(false);
    }
  };

  const handleRetry = async () => {
    if (!profile) {
      // Profile is missing - try to refresh it
      setState({ stage: 'loading' });
      await refreshProfile();
      return;
    }

    if (profile.steamId) {
      // Force refresh on retry
      loadRecommendations(true);
    } else {
      setState({ stage: 'link_steam' });
    }
  };

  // Show loading while auth is initializing
  if (authLoading || state.stage === 'loading') {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8 pb-32">
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
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative py-12 px-4 sm:px-6 lg:px-8 pb-32">

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
          <div className="space-y-4">
            <ErrorDisplay error={state.error} onRetry={handleRetry} />
            {/* Options to recover */}
            <div className="text-center space-y-4">
              <button
                onClick={() => setState({ stage: 'link_steam' })}
                className="px-6 py-3 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-lg font-mono text-sm hover:bg-neon-cyan/30 transition-colors"
              >
                ENTER STEAM ID
              </button>
              <p className="text-gray-500 text-sm font-mono">
                or
              </p>
              <button
                onClick={signOut}
                className="px-6 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-mono text-sm hover:bg-red-500/30 transition-colors"
              >
                SIGN OUT
              </button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {state.stage === 'recommendations' && profile && (
          <div className="space-y-8 stagger-children">
            {/* User Profile Card */}
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

                      {/* Sync & Reset Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => isPremium ? handleResync() : setIsUpgradeModalOpen(true)}
                          className="btn-arcade rounded-lg flex items-center gap-2 text-sm"
                          title="Re-fetch your Steam library and update recommendations"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          SYNC LIBRARY
                          {!isPremium && (
                            <span className="px-1.5 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                              PRO
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => setIsResetTasteModalOpen(true)}
                          className="px-3 py-2 bg-terminal-dark border border-terminal-border text-gray-400 font-mono text-sm rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all flex items-center gap-2"
                          title="Reset your taste training from likes/dislikes"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          RESET TASTE
                        </button>
                      </div>
                    </div>

                    {/* Top Games & Taste DNA Row */}
                    <div className="border-t border-terminal-border pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Top Games */}
                        {topGames.length > 0 && (
                          <div className="lg:col-span-2">
                            <h3 className="text-xs font-mono text-neon-cyan uppercase tracking-widest mb-4">
                              <span className="text-gray-500">&gt;</span> MOST_PLAYED.log
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-4">
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

                        {/* Taste DNA Compact Card */}
                        <div className={topGames.length > 0 ? 'lg:col-span-1' : 'lg:col-span-3'}>
                          <TasteDNA userId={profile.id} username={username || undefined} compact />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Analytics Section - shown when ?tab=analytics */}
            {showAnalytics && (
              <AnalyticsTab
                userId={profile.id}
                gamesAnalyzed={state.gamesAnalyzed}
                totalPlaytimeHours={state.totalPlaytimeHours}
                isPremium={isPremium}
              />
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

      {/* Reset Taste Modal */}
      {isResetTasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => !isResettingTaste && setIsResetTasteModalOpen(false)}
          />
          <div className="relative terminal-box rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="orbitron text-xl font-bold text-white mb-2">
                RESET TASTE TRAINING
              </h3>
              <p className="text-gray-400 font-mono text-sm mb-6">
                This will reset the AI&apos;s learned preferences from your likes and dislikes.
                Your Steam library data will be preserved.
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => handleResetTaste(false)}
                  disabled={isResettingTaste}
                  className="w-full py-3 px-6 bg-neon-orange/20 text-neon-orange border border-neon-orange font-bold rounded-lg hover:bg-neon-orange hover:text-black transition-all orbitron disabled:opacity-50"
                >
                  {isResettingTaste ? 'RESETTING...' : 'RESET TRAINING'}
                </button>
                <button
                  onClick={() => handleResetTaste(true)}
                  disabled={isResettingTaste}
                  className="w-full py-3 px-6 bg-red-500/20 text-red-400 border border-red-500/50 font-mono text-sm rounded-lg hover:bg-red-500/30 hover:border-red-500 transition-all disabled:opacity-50"
                >
                  {isResettingTaste ? 'RESETTING...' : 'RESET & CLEAR RATING HISTORY'}
                </button>
                <button
                  onClick={() => setIsResetTasteModalOpen(false)}
                  disabled={isResettingTaste}
                  className="w-full py-3 px-6 bg-terminal-dark border border-terminal-border text-gray-400 font-mono text-sm rounded-lg hover:border-gray-500 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-gray-600 font-mono text-xs mt-4">
                Tip: &quot;Reset Training&quot; keeps your ratings so you can rebuild from them.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        <p className="text-neon-cyan font-mono text-sm">Loading...</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ProfileContent />
    </Suspense>
  );
}
