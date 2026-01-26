'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import DiscoverySection from '@/components/discover/DiscoverySection';
import { GameRecommendation, getRecommendations, RecommendationFilters } from '@/lib/api-client';

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
  {
    id: 'trending-now',
    title: 'TRENDING NOW',
    description: 'Hot games everyone is playing right now',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    color: 'orange',
    filters: {
      minReviewScore: 75,
      releaseYearMin: currentYear - 1,
      popularityScore: 80,
      limit: 15,
    },
  },
  {
    id: 'hidden-gems',
    title: 'HIDDEN GEMS',
    description: 'Highly rated games flying under the radar',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'cyan',
    filters: {
      minReviewScore: 85,
      popularityScore: 15,
      releaseYearMin: currentYear - 3,
      limit: 15,
    },
  },
  {
    id: 'new-releases',
    title: 'NEW RELEASES',
    description: 'Fresh games from this year worth checking out',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'green',
    filters: {
      minReviewScore: 70,
      releaseYearMin: currentYear,
      popularityScore: 50,
      limit: 15,
    },
  },
  {
    id: 'free-to-play',
    title: 'FREE TO PLAY',
    description: 'Quality games that cost nothing to try',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    color: 'magenta',
    filters: {
      isFree: true,
      minReviewScore: 75,
      popularityScore: 50,
      limit: 15,
    },
  },
  {
    id: 'critically-acclaimed',
    title: 'CRITICALLY ACCLAIMED',
    description: 'Games with outstanding reviews and Metacritic scores',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'yellow',
    filters: {
      minReviewScore: 90,
      minReviewCount: 1000,
      popularityScore: 70,
      limit: 15,
    },
  },
  {
    id: 'all-time-classics',
    title: 'ALL-TIME CLASSICS',
    description: 'Legendary games that defined their genres',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'red',
    filters: {
      minReviewScore: 92,
      releaseYearMax: currentYear - 5,
      popularityScore: 85,
      limit: 15,
    },
  },
];

export default function DiscoverPage() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get('userId');

  const [userId, setUserId] = useState<string | null>(null);
  const [categoryGames, setCategoryGames] = useState<Record<string, GameRecommendation[]>>({});
  const [loadingCategories, setLoadingCategories] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Load userId from URL param or localStorage
  useEffect(() => {
    if (userIdParam) {
      setUserId(userIdParam);
      localStorage.setItem('steam_recs_user_id', userIdParam);
    } else {
      const storedUserId = localStorage.getItem('steam_recs_user_id');
      if (storedUserId) {
        setUserId(storedUserId);
      }
    }
  }, [userIdParam]);

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
                  DISCOVER YOUR NEXT
                  <span className="block text-neon-cyan">FAVORITE GAME</span>
                </h1>
                <p className="text-gray-400 font-mono text-lg max-w-2xl">
                  Browse curated collections tailored to your gaming taste.
                  From hidden gems to trending hits, find something new to play.
                </p>

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

        {/* Discovery Sections */}
        <div className="max-w-7xl mx-auto pb-16">
          {userId ? (
            DISCOVERY_CATEGORIES.map((category) => (
              <DiscoverySection
                key={category.id}
                title={category.title}
                description={category.description}
                icon={category.icon}
                color={category.color}
                filters={category.filters}
                userId={userId}
                games={categoryGames[category.id] || []}
                isLoading={loadingCategories.has(category.id)}
              />
            ))
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
