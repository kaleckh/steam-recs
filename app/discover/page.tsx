'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import DiscoverySection from '@/components/discover/DiscoverySection';
import DailyDiscovery from '@/components/discover/DailyDiscovery';
import MoodQuickMatch from '@/components/discover/MoodQuickMatch';
import { GameRecommendation, getRecommendations, RecommendationFilters } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

const currentYear = new Date().getFullYear();

interface DiscoveryCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'cyan' | 'orange' | 'green' | 'magenta' | 'yellow' | 'red';
  filters: Partial<RecommendationFilters>;
}

const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  // NICHE FIRST - The main value proposition
  {
    id: 'hidden-gems',
    title: 'HIDDEN GEMS',
    description: 'Highly rated games most people haven\'t discovered',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'cyan',
    filters: {
      minReviewScore: 90,
      maxReviewCount: 5000, // Truly hidden - under 5k reviews
      limit: 15,
    },
  },
  {
    id: 'rising-indies',
    title: 'RISING INDIES',
    description: 'Small studios making waves right now',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: 'green',
    filters: {
      minReviewScore: 85,
      maxReviewCount: 15000,
      releaseYearMin: currentYear - 2,
      limit: 15,
    },
  },
  {
    id: 'cult-classics',
    title: 'CULT CLASSICS',
    description: 'Small fanbases, devoted followers',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    color: 'magenta',
    filters: {
      minReviewScore: 88,
      maxReviewCount: 10000,
      releaseYearMax: currentYear - 3,
      limit: 15,
    },
  },
  {
    id: 'deep-cuts',
    title: 'DEEP CUTS',
    description: 'Based on your taste, way off the radar',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    color: 'yellow',
    filters: {
      minReviewScore: 80,
      maxReviewCount: 3000, // Very niche
      limit: 15,
    },
  },
  // ANCHOR - Popular category for recognition/trust
  {
    id: 'trending-now',
    title: 'TRENDING NOW',
    description: 'What everyone is playing',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    color: 'orange',
    filters: {
      minReviewScore: 80,
      minReviewCount: 20000,
      releaseYearMin: currentYear - 2,
      limit: 10, // Smaller - just anchor games
    },
  },
  // QUALITY ANCHOR - Earned popularity
  {
    id: 'critically-acclaimed',
    title: 'CRITICALLY ACCLAIMED',
    description: 'Games that defined standards',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'red',
    filters: {
      minReviewScore: 90,
      minReviewCount: 5000,
      limit: 15,
    },
  },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');
  const { profile, isLoading: authLoading } = useAuth();

  // Use profile ID from auth context, or URL param as fallback
  const userId = profile?.id || userIdParam;

  const [categoryGames, setCategoryGames] = useState<Record<string, GameRecommendation[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());

  // Fetch games for each category
  useEffect(() => {
    if (!userId) return;

    const fetchCategoryGames = async (category: DiscoveryCategory) => {
      setLoadingCategories((prev) => new Set(prev).add(category.id));

      try {
        const response = await getRecommendations(userId, {
          ...category.filters,
          excludeOwned: true,
        });

        if (response.success && response.recommendations) {
          setCategoryGames((prev) => ({
            ...prev,
            [category.id]: response.recommendations || [],
          }));
        }
      } catch (err) {
        console.error(`Error fetching ${category.id}:`, err);
      } finally {
        setLoadingCategories((prev) => {
          const next = new Set(prev);
          next.delete(category.id);
          return next;
        });
      }
    };

    // Fetch all categories
    DISCOVERY_CATEGORIES.forEach((category) => {
      fetchCategoryGames(category);
    });
  }, [userId]);

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        {/* Hero Header */}
        <div className="pt-24 pb-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="terminal-box rounded-lg overflow-hidden">
              <div className="terminal-header">
                <span className="text-gray-400 text-sm font-mono ml-16">DISCOVER.exe</span>
              </div>
              <div className="p-8 md:p-12 bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-orange/5">
                <h1 className="orbitron text-3xl md:text-5xl font-black text-white mb-4">
                  FIND GAMES
                  <span className="block text-neon-cyan">YOU&apos;VE NEVER HEARD OF</span>
                </h1>
                <p className="text-gray-400 font-mono text-lg max-w-2xl">
                  Discover hidden gems, cult classics, and rising indies matched to your taste.
                  The best games you haven&apos;t played yet.
                </p>

                {userId && profile?.steamId && (
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-mono">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-green/10 border border-neon-green/30 rounded-full">
                        <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-neon-green">Personalized for your Steam library</span>
                      </div>
                      <span className="text-gray-500">
                        Based on {profile.gamesAnalyzed || 0} games &bull; {Math.round(profile.totalPlaytimeHours || 0)}h played
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-mono">
                      <span className="text-gray-500">Not quite right?</span>
                      <Link
                        href="/search"
                        className="inline-flex items-center gap-1.5 text-neon-cyan hover:text-white transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        Train your taste with AI Search
                      </Link>
                    </div>
                  </div>
                )}

                {(!userId || !profile?.steamId) && (
                  <div className="mt-8 p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                    <p className="text-neon-orange font-mono text-sm mb-3">
                      {userId ? 'Connect your Steam account to get personalized recommendations' : 'Sign in and link your Steam account to get personalized recommendations'}
                    </p>
                    <Link
                      href={userId ? '/profile' : '/login'}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neon-orange text-black font-mono text-sm font-bold rounded hover:bg-neon-yellow transition-colors"
                    >
                      {userId ? 'CONNECT STEAM' : 'SIGN IN'}
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Daily Discovery - Your Perfect Pick */}
        {userId && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
            <DailyDiscovery userId={userId} />
          </div>
        )}

        {/* Mood Quick-Match */}
        {userId && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
            <MoodQuickMatch userId={userId} />
          </div>
        )}

        {/* Discovery Sections */}
        <div className="max-w-7xl mx-auto pb-16">
          {userId && profile?.steamId ? (
            DISCOVERY_CATEGORIES.map((category) => {
              const games = categoryGames[category.id] || [];

              return (
                <DiscoverySection
                  key={category.id}
                  title={category.title}
                  description={category.description}
                  icon={category.icon}
                  color={category.color}
                  filters={category.filters}
                  userId={userId}
                  games={games}
                  isLoading={loadingCategories.has(category.id)}
                />
              );
            })
          ) : (
            /* Show locked category previews when not logged in or Steam not linked */
            <div className="space-y-8 px-4 md:px-8">
              {DISCOVERY_CATEGORIES.map((category, index) => {
                const colorClasses = {
                  cyan: 'text-neon-cyan border-neon-cyan/30',
                  orange: 'text-neon-orange border-neon-orange/30',
                  green: 'text-neon-green border-neon-green/30',
                  magenta: 'text-neon-magenta border-neon-magenta/30',
                  yellow: 'text-neon-yellow border-neon-yellow/30',
                  red: 'text-red-500 border-red-500/30',
                };

                // Different CTA based on whether user is logged in
                const isLoggedIn = !!userId;
                const ctaHref = isLoggedIn ? '/profile' : '/login';
                const ctaText = isLoggedIn ? 'CONNECT STEAM' : 'SIGN IN';
                const ctaMessage = isLoggedIn
                  ? 'Connect your Steam account for personalized recommendations'
                  : 'Sign in and connect Steam for personalized recommendations';

                return (
                  <div key={category.id} className="relative">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg bg-terminal-dark border ${colorClasses[category.color]} opacity-50`}>
                        {category.icon}
                      </div>
                      <div>
                        <h2 className={`orbitron text-lg font-bold ${colorClasses[category.color].split(' ')[0]} opacity-50`}>
                          {category.title}
                        </h2>
                        <p className="text-gray-600 font-mono text-xs">
                          {category.description}
                        </p>
                      </div>
                    </div>

                    {/* Locked Placeholder Cards */}
                    <div className="relative">
                      <div className="flex gap-4 overflow-hidden">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className="flex-shrink-0 w-48 h-32 rounded-lg bg-terminal-dark/50 border border-terminal-border/30"
                            style={{ filter: 'blur(4px)' }}
                          />
                        ))}
                      </div>

                      {/* Overlay with CTA - show on first category only */}
                      {index === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-terminal-dark/90 via-terminal-dark/80 to-terminal-dark/90 rounded-lg">
                          <div className="text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 mx-auto mb-3 flex items-center justify-center">
                              <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </div>
                            <p className="text-white font-mono text-sm mb-3">
                              {ctaMessage}
                            </p>
                            <Link
                              href={ctaHref}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan text-black font-mono text-sm font-bold rounded-lg hover:bg-white transition-colors"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2a10 10 0 00-3.16 19.5l3.16-7.03v-2.32a2 2 0 012-2h.01a2 2 0 011.99 2.18l-.17 2.14 3.17 7.03A10 10 0 0012 2z"/>
                              </svg>
                              {ctaText}
                            </Link>
                          </div>
                        </div>
                      )}

                      {/* Simple lock icon for other categories */}
                      {index !== 0 && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-terminal-dark/80 border border-terminal-border flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        <div className="pt-24 pb-8 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="terminal-box rounded-lg overflow-hidden p-12">
              <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DiscoverContent />
    </Suspense>
  );
}
