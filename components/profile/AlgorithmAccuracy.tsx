'use client';

import { useEffect, useState } from 'react';

interface AlgorithmAccuracyProps {
  ratingsCount: number;
  gamesAnalyzed: number;
  userId?: string;
}

interface RatingBreakdown {
  positive: number;
  negative: number;
}

export default function AlgorithmAccuracy({ ratingsCount, gamesAnalyzed, userId }: AlgorithmAccuracyProps) {
  const [breakdown, setBreakdown] = useState<RatingBreakdown>({ positive: 0, negative: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBreakdown() {
      if (!userId || ratingsCount === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/user/feedback?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setBreakdown({
            positive: data.history.liked?.length || 0,
            negative: data.history.disliked?.length || 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch rating breakdown:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBreakdown();
  }, [userId, ratingsCount]);

  const getStatusMessage = () => {
    if (ratingsCount === 0) return "AWAITING_INPUT";
    if (ratingsCount < 5) return "CALIBRATING";
    if (ratingsCount < 15) return "LEARNING";
    if (ratingsCount < 30) return "OPTIMIZED";
    return "HIGHLY_TRAINED";
  };

  const getStatusColor = () => {
    if (ratingsCount === 0) return "text-gray-500";
    if (ratingsCount < 5) return "text-neon-yellow";
    if (ratingsCount < 15) return "text-neon-cyan";
    return "text-neon-green";
  };

  const getProgressLevel = () => {
    if (ratingsCount === 0) return 0;
    if (ratingsCount < 5) return 25;
    if (ratingsCount < 15) return 50;
    if (ratingsCount < 30) return 75;
    return 100;
  };

  const positivePercentage = ratingsCount > 0 ? (breakdown.positive / ratingsCount) * 100 : 0;
  const negativePercentage = ratingsCount > 0 ? (breakdown.negative / ratingsCount) * 100 : 0;

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">FEEDBACK_STATS.dat</span>
      </div>

      <div className="p-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="orbitron text-xl font-bold text-white mb-2">NEURAL FEEDBACK</h3>
            <p className={`text-sm font-mono ${getStatusColor()}`}>
              <span className="text-gray-500">&gt;</span> STATUS: {getStatusMessage()}
            </p>
          </div>
          <div className="text-right">
            <div className={`orbitron text-4xl font-black ${getStatusColor()}`}>
              {ratingsCount}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">RATINGS</div>
          </div>
        </div>

        {/* Training Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-gray-500">TRAINING_LEVEL</span>
            <span className={getStatusColor()}>{getProgressLevel()}%</span>
          </div>
          <div className="h-2 progress-bar-retro rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-700 ${
                ratingsCount >= 30 ? 'progress-fill-green' :
                ratingsCount >= 15 ? 'progress-fill-cyan' :
                'bg-neon-yellow'
              }`}
              style={{ width: `${getProgressLevel()}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-600 mt-1 font-mono">
            <span>INIT</span>
            <span>5</span>
            <span>15</span>
            <span>30+</span>
          </div>
        </div>

        {/* Positive/Negative Breakdown */}
        {ratingsCount > 0 && !loading && (
          <div className="mb-6 p-4 bg-terminal-dark rounded-lg border border-terminal-border">
            <div className="flex items-center justify-between mb-3 text-sm font-mono">
              <span className="text-neon-green flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                {breakdown.positive} POSITIVE
              </span>
              <span className="text-neon-magenta flex items-center gap-2">
                {breakdown.negative} NEGATIVE
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </span>
            </div>
            <div className="h-3 progress-bar-retro rounded overflow-hidden flex">
              {breakdown.positive > 0 && (
                <div
                  className="h-full progress-fill-green transition-all duration-500"
                  style={{ width: `${positivePercentage}%` }}
                />
              )}
              {breakdown.negative > 0 && (
                <div
                  className="h-full progress-fill-magenta transition-all duration-500"
                  style={{ width: `${negativePercentage}%` }}
                />
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {ratingsCount === 0 && (
          <div className="mb-6 p-4 bg-terminal-dark rounded-lg border border-terminal-border border-dashed">
            <p className="text-sm text-gray-500 font-mono text-center">
              <span className="text-neon-yellow">[!]</span> No feedback data collected
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-terminal-dark border border-terminal-border rounded-lg p-4 text-center">
            <div className="orbitron text-2xl font-bold text-neon-cyan mb-1">{gamesAnalyzed}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">GAMES_ANALYZED</div>
          </div>
          <div className="bg-terminal-dark border border-terminal-border rounded-lg p-4 text-center">
            <div className="orbitron text-2xl font-bold text-neon-magenta mb-1">{ratingsCount}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">GAMES_RATED</div>
          </div>
        </div>

        {/* Call to Action */}
        {ratingsCount < 20 && (
          <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
            <p className="text-sm text-neon-cyan font-mono">
              <span className="text-gray-500">&gt;</span>{' '}
              {ratingsCount === 0
                ? "Rate recommendations to train the neural network"
                : "Continue rating to improve prediction accuracy"
              }
            </p>
          </div>
        )}

        {/* View History Link */}
        {ratingsCount > 0 && userId && (
          <div className="pt-6 border-t border-terminal-border mt-6">
            <a
              href={`/profile/history?userId=${userId}`}
              className="text-sm font-mono text-neon-cyan hover:text-neon-magenta flex items-center gap-2 group transition-colors"
            >
              <span>&gt; VIEW_RATING_HISTORY</span>
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
