'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GameRecommendation } from '@/lib/api-client';

interface FeedbackHistoryItem extends GameRecommendation {
  feedbackType: 'love' | 'like' | 'dislike' | 'not_interested';
  createdAt: string;
}

interface FeedbackHistory {
  liked: FeedbackHistoryItem[];
  disliked: FeedbackHistoryItem[];
}

function HistoryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const [history, setHistory] = useState<FeedbackHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    fetchHistory(userId);
  }, [userId]);

  const fetchHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/feedback?userId=${userId}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      } else {
        setError(data.error || 'Failed to load feedback history');
      }
    } catch {
      setError('An error occurred while loading your feedback history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFeedback = async (appId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/user/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, appId }),
      });

      if (response.ok) {
        // Refresh history
        fetchHistory(userId);
      }
    } catch (err) {
      console.error('Failed to remove feedback:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center py-20">
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
          </div>
        </div>
      </div>
    );
  }

  if (error || !history) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-xl"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  const GameCard = ({ game }: { game: FeedbackHistoryItem }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group">
      <div className="relative aspect-video overflow-hidden bg-gray-900">
        {game.headerImage ? (
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            No image available
          </div>
        )}
        <div className="absolute top-3 right-3">
          <button
            onClick={() => handleRemoveFeedback(game.appId)}
            className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg shadow-lg transition-colors"
            title="Remove from history"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-1">{game.name}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            {game.releaseYear ?? 'N/A'}
          </span>
          <a
            href={`https://store.steampowered.com/app/${game.appId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View on Steam →
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/profile')}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 flex items-center gap-2 group"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Rating History</h1>
          <p className="text-lg text-gray-500">
            View all games you&apos;ve rated and manage your feedback
          </p>
        </div>

        {/* Liked Games Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl shadow-xl p-6 text-white mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span>❤️</span>
              <span>Liked Games</span>
            </h2>
            <p className="text-green-100 mt-2">
              {history.liked.length} games you loved or liked
            </p>
          </div>

          {history.liked.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <p className="text-gray-500">You haven&apos;t liked any games yet. Start rating recommendations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.liked.map((game) => (
                <GameCard key={game.appId} game={game} />
              ))}
            </div>
          )}
        </div>

        {/* Disliked Games Section */}
        <div>
          <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl shadow-xl p-6 text-white mb-6">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <span>👎</span>
              <span>Disliked Games</span>
            </h2>
            <p className="text-red-100 mt-2">
              {history.disliked.length} games you disliked or weren&apos;t interested in
            </p>
          </div>

          {history.disliked.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <p className="text-gray-500">You haven&apos;t disliked any games yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {history.disliked.map((game) => (
                <GameCard key={game.appId} game={game} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-center items-center py-20">
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
        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HistoryContent />
    </Suspense>
  );
}
