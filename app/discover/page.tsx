'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import DiscoverySection from '@/components/discover/DiscoverySection';
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
      minReviewScore: 95,
      minReviewCount: 10000,
      limit: 10,
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
  const [featuredGem, setFeaturedGem] = useState<GameRecommendation | null>(null);

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
          // Set featured gem from hidden gems category (first result)
          if (category.id === 'hidden-gems' && response.recommendations.length > 0) {
            setFeaturedGem(response.recommendations[0]);
          }
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

                {!userId && (
                  <div className="mt-8 p-4 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
                    <p className="text-neon-orange font-mono text-sm mb-3">
                      Link your Steam account to get personalized recommendations
                    </p>
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neon-orange text-black font-mono text-sm font-bold rounded hover:bg-neon-yellow transition-colors"
                    >
                      LINK STEAM ACCOUNT
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

        {/* Featured Hidden Gem */}
        {userId && featuredGem && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 mb-8">
            <div className="terminal-box rounded-lg overflow-hidden">
              <div className="terminal-header">
                <span className="text-neon-cyan text-sm font-mono ml-16">FEATURED_GEM.exe</span>
              </div>
              <div className="relative">
                {/* Background image with gradient overlay */}
                <div className="absolute inset-0">
                  {featuredGem.headerImage && (
                    <img
                      src={featuredGem.headerImage}
                      alt=""
                      className="w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-terminal-dark via-terminal-dark/90 to-transparent" />
                </div>

                <div className="relative p-8 md:p-12 flex flex-col md:flex-row gap-8 items-center">
                  {/* Game image */}
                  <Link href={`/game/${featuredGem.appId}`} className="flex-shrink-0 group">
                    <div className="relative">
                      <img
                        src={featuredGem.headerImage || `https://steamcdn-a.akamaihd.net/steam/apps/${featuredGem.appId}/header.jpg`}
                        alt={featuredGem.name}
                        className="w-72 h-auto rounded-lg shadow-2xl shadow-neon-cyan/20 group-hover:shadow-neon-cyan/40 transition-shadow"
                      />
                      <div className="absolute top-3 right-3 bg-neon-cyan text-black px-3 py-1 rounded-full text-sm font-mono font-bold">
                        {Math.round(featuredGem.similarity * 100)}% MATCH
                      </div>
                    </div>
                  </Link>

                  {/* Game info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-neon-cyan font-mono text-sm uppercase tracking-wider">Today&apos;s Hidden Gem</span>
                    </div>

                    <Link href={`/game/${featuredGem.appId}`}>
                      <h2 className="orbitron text-2xl md:text-4xl font-black text-white mb-3 hover:text-neon-cyan transition-colors">
                        {featuredGem.name}
                      </h2>
                    </Link>

                    {featuredGem.shortDescription && (
                      <p className="text-gray-400 font-mono text-sm md:text-base mb-4 max-w-xl">
                        {featuredGem.shortDescription}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-mono">
                      {featuredGem.reviewScore && (
                        <span className="text-green-400">
                          {featuredGem.reviewScore}% Positive
                        </span>
                      )}
                      {featuredGem.releaseYear && (
                        <span className="text-gray-500">{featuredGem.releaseYear}</span>
                      )}
                      {featuredGem.reviewCount && (
                        <span className="text-neon-orange">
                          {featuredGem.reviewCount < 1000
                            ? `${featuredGem.reviewCount} reviews`
                            : `${(featuredGem.reviewCount / 1000).toFixed(1)}k reviews`}
                        </span>
                      )}
                      {featuredGem.genres && featuredGem.genres.length > 0 && (
                        <span className="text-gray-500">
                          {featuredGem.genres.slice(0, 2).join(' · ')}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/game/${featuredGem.appId}`}
                      className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-neon-cyan text-black font-mono font-bold rounded-lg hover:bg-white transition-colors"
                    >
                      VIEW DETAILS
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discovery Sections */}
        <div className="max-w-7xl mx-auto pb-16">
          {userId ? (
            DISCOVERY_CATEGORIES.map((category) => {
              // Exclude featured gem from hidden gems to avoid duplication
              const games = category.id === 'hidden-gems' && featuredGem
                ? (categoryGames[category.id] || []).filter(g => g.appId !== featuredGem.appId)
                : (categoryGames[category.id] || []);

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
            <div className="text-center py-16 px-4">
              <div className="terminal-box rounded-lg p-12 max-w-lg mx-auto">
                <div className="w-20 h-20 rounded-full bg-terminal-light border-2 border-terminal-border mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="orbitron text-2xl font-bold text-white mb-4">
                  UNLOCK PERSONALIZED DISCOVERY
                </h2>
                <p className="text-gray-400 font-mono text-sm mb-6">
                  Link your Steam account to see game recommendations tailored to your unique gaming preferences and play history.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-neon-cyan text-black font-mono font-bold rounded-lg hover:bg-white transition-colors"
                >
                  GET STARTED
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
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
