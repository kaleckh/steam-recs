'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface FeedbackHistoryItem {
  appId: string;
  name: string;
  feedbackType: 'love' | 'like' | 'dislike' | 'not_interested';
  createdAt: string;
  metadata?: {
    headerImage?: string;
    releaseDate?: string;
  };
}

interface FeedbackHistory {
  liked: FeedbackHistoryItem[];
  disliked: FeedbackHistoryItem[];
}

interface LibraryTabProps {
  userId: string;
}

export default function LibraryTab({ userId }: LibraryTabProps) {
  const [history, setHistory] = useState<FeedbackHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'liked' | 'disliked'>('liked');

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
      setError('An error occurred while loading your library');
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
        fetchHistory(userId);
      }
    } catch (err) {
      console.error('Failed to remove feedback:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
          </div>
          <p className="text-neon-cyan font-mono">LOADING LIBRARY...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-box rounded-lg p-8 text-center">
        <p className="text-red-500 font-mono mb-4">[ERROR] {error}</p>
        <button
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchHistory(userId);
          }}
          className="text-neon-cyan font-mono text-sm hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const likedCount = history?.liked.length || 0;
  const dislikedCount = history?.disliked.length || 0;
  const totalCount = likedCount + dislikedCount;

  return (
    <div className="space-y-6">
      {/* Library Header */}
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">LIBRARY.db</span>
        </div>

        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="orbitron text-xl font-bold text-white mb-1">
                YOUR RATED GAMES
              </h2>
              <p className="text-gray-500 font-mono text-sm">
                {totalCount} games rated • Helps train your AI recommendations
              </p>
            </div>

            {/* Section Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection('liked')}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  activeSection === 'liked'
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green'
                    : 'bg-terminal-dark text-gray-500 border border-terminal-border hover:border-gray-500'
                }`}
              >
                LIKED ({likedCount})
              </button>
              <button
                onClick={() => setActiveSection('disliked')}
                className={`px-4 py-2 rounded-lg font-mono text-sm transition-all ${
                  activeSection === 'disliked'
                    ? 'bg-red-500/20 text-red-400 border border-red-500'
                    : 'bg-terminal-dark text-gray-500 border border-terminal-border hover:border-gray-500'
                }`}
              >
                DISLIKED ({dislikedCount})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {totalCount === 0 && (
        <div className="terminal-box rounded-lg p-12 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-terminal-dark border-2 border-terminal-border">
              <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="orbitron text-lg font-bold text-white mb-2">
            NO RATED GAMES YET
          </h3>
          <p className="text-gray-500 font-mono text-sm mb-6 max-w-md mx-auto">
            Rate games from your recommendations to train the AI and build your library.
          </p>
          <p className="text-neon-cyan font-mono text-xs">
            <span className="text-neon-orange">//</span> TIP: Click the thumbs up/down on game cards to rate them
          </p>
        </div>
      )}

      {/* Games Grid */}
      {totalCount > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {(activeSection === 'liked' ? history?.liked : history?.disliked)?.map((game, index) => (
            <div
              key={game.appId}
              className="card-arcade rounded-lg overflow-hidden group opacity-0 animate-scale-in relative"
              style={{
                animationDelay: `${index * 0.03}s`,
                animationFillMode: 'forwards',
              }}
            >
              <Link href={`/game/${game.appId}`} className="block">
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-terminal-dark">
                  {game.metadata?.headerImage ? (
                    <img
                      src={game.metadata.headerImage}
                      alt={game.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-600 font-mono text-xs">NO IMAGE</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-terminal-dark to-transparent opacity-60" />

                  {/* Feedback Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-mono font-bold ${
                        game.feedbackType === 'love'
                          ? 'bg-pink-500/80 text-white'
                          : game.feedbackType === 'like'
                          ? 'bg-neon-green/80 text-black'
                          : game.feedbackType === 'dislike'
                          ? 'bg-red-500/80 text-white'
                          : 'bg-gray-600/80 text-white'
                      }`}
                    >
                      {game.feedbackType === 'love' && '❤️'}
                      {game.feedbackType === 'like' && '👍'}
                      {game.feedbackType === 'dislike' && '👎'}
                      {game.feedbackType === 'not_interested' && '✕'}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3">
                  <h3 className="text-white text-xs font-medium line-clamp-2 group-hover:text-neon-cyan transition-colors min-h-[2rem] orbitron">
                    {game.name}
                  </h3>
                  <p className="text-gray-600 font-mono text-[10px] mt-1">
                    {new Date(game.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFeedback(game.appId);
                }}
                className="absolute top-2 right-2 p-1.5 bg-terminal-dark/80 border border-terminal-border rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 hover:border-red-500"
                title="Remove from library"
              >
                <svg className="w-3 h-3 text-gray-400 hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Bottom accent */}
              <div className="h-0.5 bg-terminal-border overflow-hidden">
                <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-neon-cyan via-neon-orange to-neon-green transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="terminal-box rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-white font-mono text-sm font-bold mb-1">
              HOW RATINGS WORK
            </h4>
            <p className="text-gray-500 font-mono text-xs leading-relaxed">
              Your ratings help train our AI to understand your preferences. The more games you rate,
              the better your personalized recommendations become. Liked games boost similar titles,
              while disliked games help filter out what you won't enjoy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
