'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { GameRecommendation, getRecommendations } from '@/lib/api-client';
import GameCard from './GameCard';

type SortOption = 'relevance' | 'review_score' | 'metacritic' | 'newest' | 'oldest' | 'price_low' | 'price_high';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'review_score', label: 'Review Score' },
  { value: 'metacritic', label: 'Metacritic' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

interface RecommendationsListProps {
  recommendations: GameRecommendation[];
  userId?: string;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

export default function RecommendationsList({
  recommendations: initialRecommendations,
  userId,
  isPremium = false,
  onUpgradeClick,
}: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>(initialRecommendations);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [genreFilter, setGenreFilter] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Extract unique genres from recommendations
  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    recommendations.forEach(game => {
      game.genres?.forEach(genre => genreSet.add(genre));
    });
    return Array.from(genreSet).sort();
  }, [recommendations]);

  // Sort and filter recommendations
  const sortedRecommendations = useMemo(() => {
    let filtered = [...recommendations];

    // Apply genre filter
    if (genreFilter) {
      filtered = filtered.filter(game => game.genres?.includes(genreFilter));
    }

    // Apply sorting
    switch (sortBy) {
      case 'review_score':
        return filtered.sort((a, b) => (b.reviewScore ?? 0) - (a.reviewScore ?? 0));
      case 'metacritic':
        return filtered.sort((a, b) => (b.metacriticScore ?? 0) - (a.metacriticScore ?? 0));
      case 'newest':
        return filtered.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0));
      case 'oldest':
        return filtered.sort((a, b) => (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999));
      case 'price_low':
        return filtered.sort((a, b) => {
          const priceA = a.isFree ? 0 : (a.priceRaw ?? 9999999);
          const priceB = b.isFree ? 0 : (b.priceRaw ?? 9999999);
          return priceA - priceB;
        });
      case 'price_high':
        return filtered.sort((a, b) => {
          const priceA = a.isFree ? 0 : (a.priceRaw ?? 0);
          const priceB = b.isFree ? 0 : (b.priceRaw ?? 0);
          return priceB - priceA;
        });
      case 'relevance':
      default:
        return filtered.sort((a, b) => b.similarity - a.similarity);
    }
  }, [recommendations, sortBy, genreFilter]);

  useEffect(() => {
    setRecommendations(initialRecommendations);
    setOffset(0);
    setHasMore(true);
  }, [initialRecommendations]);

  const fetchMoreRecommendations = async (count: number = 10) => {
    if (!userId || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      const fetchCount = Math.max(count * 3, 30);

      const result = await getRecommendations(userId, {
        limit: fetchCount,
        excludeOwned: true,
      });

      if (result.success && result.recommendations) {
        const existingAppIds = new Set(recommendations.map(g => g.appId));
        const newGames = result.recommendations.filter(
          game => !existingAppIds.has(game.appId)
        );

        const gamesToAdd = newGames.slice(0, count);

        if (gamesToAdd.length > 0) {
          setRecommendations(prev => [...prev, ...gamesToAdd]);
          setOffset(prev => prev + gamesToAdd.length);
        } else {
          setHasMore(false);
        }

        if (newGames.length < count) {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to fetch more recommendations:', error);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (!userId || !hasMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          fetchMoreRecommendations(10);
        }
      },
      { threshold: 0.1 }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) {
      observerRef.current.observe(currentLoadMoreRef);
    }

    return () => {
      if (observerRef.current && currentLoadMoreRef) {
        observerRef.current.unobserve(currentLoadMoreRef);
      }
    };
  }, [userId, hasMore, isLoadingMore, recommendations.length, offset]);

  if (recommendations.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12">
        <div className="terminal-box rounded-lg overflow-hidden">
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">ERROR.log</span>
          </div>
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 mb-4">
              <svg className="w-8 h-8 text-neon-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="orbitron text-2xl font-bold text-white mb-2">
              NO MATCHES FOUND
            </h2>
            <p className="text-gray-400 font-mono text-sm">
              &gt; Try adjusting your filters or verify games exist in database
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show message when genre filter removes all results
  if (sortedRecommendations.length === 0 && genreFilter) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Sort & Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 terminal-box rounded-lg p-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-500 font-mono text-xs uppercase tracking-wider">Sort:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-terminal-dark border border-terminal-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors cursor-pointer"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {availableGenres.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-gray-500 font-mono text-xs uppercase tracking-wider">Genre:</label>
              <select
                value={genreFilter || ''}
                onChange={(e) => setGenreFilter(e.target.value || null)}
                className="bg-terminal-dark border border-terminal-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors cursor-pointer"
              >
                <option value="">All Genres</option>
                {availableGenres.map(genre => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto">
            <button
              onClick={() => setGenreFilter(null)}
              className="text-neon-orange hover:text-white transition-colors font-mono text-xs"
            >
              [clear filter]
            </button>
          </div>
        </div>

        <div className="terminal-box rounded-lg p-8 text-center">
          <p className="text-gray-400 font-mono">
            No games found with genre <span className="text-neon-cyan">&quot;{genreFilter}&quot;</span>
          </p>
        </div>
      </div>
    );
  }

  const handleSortChange = (value: SortOption) => {
    if (!isPremium && value !== 'relevance') {
      onUpgradeClick?.();
      return;
    }
    setSortBy(value);
  };

  const handleGenreChange = (value: string | null) => {
    if (!isPremium && value !== null) {
      onUpgradeClick?.();
      return;
    }
    setGenreFilter(value);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Sort & Filter Controls */}
      <div className="flex flex-wrap items-center gap-4 terminal-box rounded-lg p-4">
        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-gray-500 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
            Sort:
            {!isPremium && (
              <span className="px-1 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                PRO
              </span>
            )}
          </label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className={`bg-terminal-dark border border-terminal-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors cursor-pointer ${!isPremium ? 'opacity-60' : ''}`}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Genre Filter */}
        {availableGenres.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-gray-500 font-mono text-xs uppercase tracking-wider flex items-center gap-2">
              Genre:
              {!isPremium && (
                <span className="px-1 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                  PRO
                </span>
              )}
            </label>
            <select
              value={genreFilter || ''}
              onChange={(e) => handleGenreChange(e.target.value || null)}
              className={`bg-terminal-dark border border-terminal-border rounded px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan transition-colors cursor-pointer ${!isPremium ? 'opacity-60' : ''}`}
            >
              <option value="">All Genres</option>
              {availableGenres.map(genre => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Results count */}
        <div className="ml-auto text-gray-500 font-mono text-xs">
          <span className="text-neon-cyan">{sortedRecommendations.length}</span> games
          {genreFilter && (
            <button
              onClick={() => setGenreFilter(null)}
              className="ml-2 text-neon-orange hover:text-white transition-colors"
            >
              [clear filter]
            </button>
          )}
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedRecommendations.map((game, index) => (
          <div
            key={game.appId}
            className="opacity-0 animate-scale-in"
            style={{
              animationDelay: `${Math.min(index * 0.05, 0.5)}s`,
              animationFillMode: 'forwards',
            }}
          >
            <GameCard game={game} />
          </div>
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      {hasMore && userId && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoadingMore ? (
            <div className="terminal-box rounded-lg p-6 flex items-center gap-4">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-2 border-neon-cyan/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-neon-cyan rounded-full animate-spin" />
              </div>
              <p className="text-neon-cyan font-mono text-sm">LOADING MORE...</p>
            </div>
          ) : (
            <div className="h-20" />
          )}
        </div>
      )}

      {/* End of recommendations */}
      {!hasMore && sortedRecommendations.length > 0 && (
        <div className="py-8 text-center">
          <div className="terminal-box rounded-lg p-6 inline-block">
            <p className="text-gray-500 font-mono text-sm">
              <span className="text-neon-orange">[END]</span> You've reached the end of recommendations.
              <br />
              <span className="text-gray-600">Try adjusting filters for more results.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
