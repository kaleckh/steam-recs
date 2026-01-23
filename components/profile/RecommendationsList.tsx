'use client';

import { useState, useEffect, useRef } from 'react';
import { GameRecommendation, getRecommendations, type FeedbackType } from '@/lib/api-client';
import GameCard from './GameCard';
import PremiumModal from './PremiumModal';
import FeedbackToast from './FeedbackToast';

interface RecommendationsListProps {
  recommendations: GameRecommendation[];
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
  userId?: string;
  isPremium?: boolean;
  onRatingSubmitted?: () => void;
}

export default function RecommendationsList({
  recommendations: initialRecommendations,
  gamesAnalyzed,
  totalPlaytimeHours,
  userId,
  isPremium = true, // Default to true - everyone gets feedback features for now
  onRatingSubmitted,
}: RecommendationsListProps) {
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>(initialRecommendations);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');
  const [showToast, setShowToast] = useState(false);

  // Reset recommendations when initial recommendations change
  useEffect(() => {
    setRecommendations(initialRecommendations);
    setOffset(0);
    setHasMore(true);
  }, [initialRecommendations]);

  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  // Handle feedback submission - remove negative cards and fetch new ones
  const handleFeedback = async (feedbackType: FeedbackType, appId: string) => {
    // Show appropriate toast based on feedback type
    const toastMessages = {
      love: '❤️ Loved! AI is learning your preferences...',
      like: '👍 Liked! Recommendations will adapt to your taste',
      dislike: '👎 Disliked! Showing you different games...',
      not_interested: '🚫 Hidden! This game won\'t appear again',
    };

    showToastNotification(toastMessages[feedbackType], 'success');

    // Notify parent that a rating was submitted
    if (onRatingSubmitted) {
      onRatingSubmitted();
    }

    // Remove the card after fade out for ALL feedback types
    setTimeout(() => {
      setRecommendations(prev => prev.filter(game => game.appId !== appId));

      // Fetch one new game to replace the removed one
      if (userId) {
        fetchMoreRecommendations(1);
      }
    }, 600); // Wait for fade animation

    // Note: The learned vector is already updated by the feedback API call
    // New recommendations will use the updated vector automatically
  };

  // Fetch more recommendations
  const fetchMoreRecommendations = async (count: number = 10) => {
    if (!userId || isLoadingMore) return;

    setIsLoadingMore(true);

    try {
      // Fetch a larger batch to ensure we get enough unique games
      // The API uses the updated learned vector automatically for premium users
      const fetchCount = Math.max(count * 3, 30);

      const result = await getRecommendations(userId, {
        limit: fetchCount,
        excludeOwned: true,
      });

      if (result.success && result.recommendations) {
        // Filter out games we already have shown
        const existingAppIds = new Set(recommendations.map(g => g.appId));
        const newGames = result.recommendations.filter(
          game => !existingAppIds.has(game.appId)
        );

        // Take only the number we need
        const gamesToAdd = newGames.slice(0, count);

        if (gamesToAdd.length > 0) {
          setRecommendations(prev => [...prev, ...gamesToAdd]);
          setOffset(prev => prev + gamesToAdd.length);
        } else {
          // No new unique games found
          setHasMore(false);
        }

        // If we got very few new games, we might be running out
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

  // Infinite scroll observer
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
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl shadow-lg p-8 text-center">
          <svg
            className="w-16 h-16 text-yellow-600 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No Recommendations Found
          </h2>
          <p className="text-gray-600">
            Try adjusting your filters or make sure your games exist in our
            database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Stats Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Your Personalized Recommendations
            </h2>
            <p className="text-blue-100">
              Based on AI analysis of your gaming preferences
            </p>
          </div>
          <div className="flex gap-6 text-center">
            <div className="bg-white/20 rounded-xl px-6 py-3 backdrop-blur">
              <div className="text-3xl font-bold">{gamesAnalyzed}</div>
              <div className="text-sm text-blue-100">Games Analyzed</div>
            </div>
            {totalPlaytimeHours !== undefined && (
              <div className="bg-white/20 rounded-xl px-6 py-3 backdrop-blur">
                <div className="text-3xl font-bold">
                  {Math.round(totalPlaytimeHours).toLocaleString()}
                </div>
                <div className="text-sm text-blue-100">Hours Played</div>
              </div>
            )}
            <div className="bg-white/20 rounded-xl px-6 py-3 backdrop-blur">
              <div className="text-3xl font-bold">{recommendations.length}</div>
              <div className="text-sm text-blue-100">Recommendations</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          <strong>How it works:</strong> Our AI analyzed your playtime,
          achievements, and game preferences to find games that match your
          taste. Higher percentages mean better matches!
        </p>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
        {recommendations.map((game) => (
          <div
            key={game.appId}
            className="transition-all duration-500 ease-in-out"
            style={{
              animation: `slideIn 0.6s ease-out both`,
            }}
          >
            <GameCard
              game={game}
              userId={userId}
              isPremium={isPremium}
              onFeedbackSubmitted={handleFeedback}
              onPremiumRequired={() => setShowPremiumModal(true)}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      {/* Infinite Scroll Trigger */}
      {hasMore && userId && (
        <div ref={loadMoreRef} className="py-8 flex justify-center">
          {isLoadingMore ? (
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
              <p className="text-gray-600 font-medium">Loading more recommendations...</p>
            </div>
          ) : (
            <div className="h-20"></div>
          )}
        </div>
      )}

      {/* End of recommendations message */}
      {!hasMore && recommendations.length > 0 && (
        <div className="py-8 text-center">
          <p className="text-gray-600">
            You've reached the end of your recommendations. Try adjusting your filters for more results!
          </p>
        </div>
      )}

      {/* Premium Modal */}
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={() => {
          // TODO: Implement Stripe checkout
          alert('Payment integration coming soon! For now, contact support to activate Premium.');
          setShowPremiumModal(false);
        }}
      />

      {/* Feedback Toast */}
      <FeedbackToast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}
