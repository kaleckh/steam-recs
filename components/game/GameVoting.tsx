'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface GameVotingProps {
  appId: string;
  gameName: string;
  compact?: boolean;
}

type FeedbackType = 'like' | 'dislike' | 'love' | 'not_interested' | null;

export default function GameVoting({ appId, gameName, compact = false }: GameVotingProps) {
  const { profile, isPremium } = useAuth();
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);

  // Fetch existing feedback on mount
  useEffect(() => {
    if (!profile?.id) return;

    const fetchFeedback = async () => {
      try {
        const response = await fetch(`/api/user/feedback?userId=${profile.id}`);
        const data = await response.json();
        if (data.success && data.feedback) {
          const gameFeedback = data.feedback.find(
            (f: { appId: string; feedbackType: string }) => f.appId === appId
          );
          if (gameFeedback) {
            setCurrentFeedback(gameFeedback.feedbackType as FeedbackType);
          }
        }
      } catch (error) {
        console.error('Failed to fetch feedback:', error);
      }
    };

    fetchFeedback();
  }, [profile?.id, appId]);

  const handleVote = async (feedbackType: 'like' | 'dislike') => {
    if (!profile?.id) return;

    // If clicking the same feedback, remove it
    if (currentFeedback === feedbackType) {
      setIsLoading(true);
      try {
        await fetch(`/api/user/feedback?userId=${profile.id}&appId=${appId}`, {
          method: 'DELETE',
        });
        setCurrentFeedback(null);
      } catch (error) {
        console.error('Failed to remove feedback:', error);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/user/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          appId: parseInt(appId),
          feedbackType,
        }),
      });

      const data = await response.json();

      if (data.requiresPremium) {
        setShowPremiumPrompt(true);
        return;
      }

      if (data.success) {
        setCurrentFeedback(feedbackType);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Not logged in
  if (!profile?.id) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleVote('like')}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-all ${
            currentFeedback === 'like'
              ? 'bg-neon-green/20 border-2 border-neon-green text-neon-green'
              : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:border-neon-green/50 hover:text-neon-green'
          } disabled:opacity-50`}
          title="Like - More like this"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          onClick={() => handleVote('dislike')}
          disabled={isLoading}
          className={`p-2 rounded-lg transition-all ${
            currentFeedback === 'dislike'
              ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
              : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:border-red-500/50 hover:text-red-500'
          } disabled:opacity-50`}
          title="Dislike - Less like this"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-terminal-dark rounded-lg border border-terminal-border">
        <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
          TRAIN YOUR TASTE
        </div>
        <p className="text-gray-400 font-mono text-xs mb-4">
          Rate this game to improve your recommendations
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleVote('like')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-sm transition-all ${
              currentFeedback === 'like'
                ? 'bg-neon-green/20 border-2 border-neon-green text-neon-green'
                : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:border-neon-green hover:text-neon-green'
            } disabled:opacity-50`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
            </svg>
            {currentFeedback === 'like' ? 'LIKED' : 'LIKE'}
          </button>
          <button
            onClick={() => handleVote('dislike')}
            disabled={isLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-mono text-sm transition-all ${
              currentFeedback === 'dislike'
                ? 'bg-red-500/20 border-2 border-red-500 text-red-500'
                : 'bg-terminal-dark border border-terminal-border text-gray-400 hover:border-red-500 hover:text-red-500'
            } disabled:opacity-50`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
            </svg>
            {currentFeedback === 'dislike' ? 'DISLIKED' : 'DISLIKE'}
          </button>
        </div>
        {currentFeedback && (
          <p className="text-xs text-gray-500 font-mono mt-3 text-center">
            {currentFeedback === 'like'
              ? "You'll see more games like this"
              : "You'll see fewer games like this"}
          </p>
        )}
      </div>

      {/* Premium Prompt Modal */}
      {showPremiumPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowPremiumPrompt(false)}
          />
          <div className="relative terminal-box rounded-lg p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-orange/20 border-2 border-neon-orange flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="orbitron text-xl font-bold text-white mb-2">
                PREMIUM FEATURE
              </h3>
              <p className="text-gray-400 font-mono text-sm mb-6">
                Upgrade to Premium to train your taste and get smarter recommendations.
              </p>
              <div className="space-y-3">
                <a
                  href="/profile?tab=analytics"
                  className="block w-full py-3 px-6 bg-neon-orange text-black font-bold rounded-lg hover:bg-neon-yellow transition-all orbitron text-center"
                >
                  UPGRADE TO PRO
                </a>
                <button
                  onClick={() => setShowPremiumPrompt(false)}
                  className="w-full py-3 px-6 bg-terminal-dark border border-terminal-border text-gray-400 font-mono text-sm rounded-lg hover:border-gray-500 hover:text-white transition-all"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
