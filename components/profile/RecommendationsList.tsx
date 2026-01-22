'use client';

import { GameRecommendation } from '@/lib/api-client';
import GameCard from './GameCard';

interface RecommendationsListProps {
  recommendations: GameRecommendation[];
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
}

export default function RecommendationsList({
  recommendations,
  gamesAnalyzed,
  totalPlaytimeHours,
}: RecommendationsListProps) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((game) => (
          <GameCard key={game.appId} game={game} />
        ))}
      </div>
    </div>
  );
}
