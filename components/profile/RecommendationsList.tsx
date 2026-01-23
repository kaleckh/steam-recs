'use client';

import { useState, useEffect, useRef } from 'react';
import { GameRecommendation, getRecommendations } from '@/lib/api-client';
import GameCard from './GameCard';

interface RecommendationsListProps {
  recommendations: GameRecommendation[];
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
  userId?: string;
}

export default function RecommendationsList({
  recommendations: initialRecommendations,
  gamesAnalyzed,
  totalPlaytimeHours,
  userId,
}: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>(initialRecommendations);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Stats Banner */}
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">RECOMMENDATIONS.output</span>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="orbitron text-2xl font-bold text-white mb-2">
                <span className="text-neon-cyan glow-cyan">PERSONALIZED</span> RESULTS
              </h2>
              <p className="text-gray-400 font-mono text-sm">
                <span className="text-neon-green">&gt;</span> AI-curated based on your gaming profile
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-terminal-dark border border-terminal-border rounded-lg px-6 py-3 text-center">
                <div className="orbitron text-2xl font-bold text-neon-green">{gamesAnalyzed}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Analyzed</div>
              </div>
              {totalPlaytimeHours !== undefined && (
                <div className="bg-terminal-dark border border-terminal-border rounded-lg px-6 py-3 text-center">
                  <div className="orbitron text-2xl font-bold text-neon-magenta">
                    {Math.round(totalPlaytimeHours).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Hours</div>
                </div>
              )}
              <div className="bg-terminal-dark border border-terminal-border rounded-lg px-6 py-3 text-center">
                <div className="orbitron text-2xl font-bold text-neon-cyan">{recommendations.length}</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Matches</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="terminal-box rounded-lg p-4 border-l-4 border-l-neon-cyan">
        <p className="text-sm text-gray-400 font-mono">
          <span className="text-neon-cyan">[INFO]</span> Our neural network analyzed your playtime patterns,
          achievements, and preferences to find similar games using vector embeddings.
          Higher review scores indicate community-verified quality.
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {recommendations.map((game, index) => (
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
      {!hasMore && recommendations.length > 0 && (
        <div className="py-8 text-center">
          <div className="terminal-box rounded-lg p-6 inline-block">
            <p className="text-gray-500 font-mono text-sm">
              <span className="text-neon-magenta">[END]</span> You've reached the end of recommendations.
              <br />
              <span className="text-gray-600">Try adjusting filters for more results.</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
