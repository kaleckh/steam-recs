interface AlgorithmAccuracyProps {
  ratingsCount: number;
  gamesAnalyzed: number;
  userId?: string;
}

export default function AlgorithmAccuracy({ ratingsCount, gamesAnalyzed, userId }: AlgorithmAccuracyProps) {
  // Determine status message based on ratings
  const getStatusMessage = () => {
    if (ratingsCount === 0) return "Start rating games to personalize recommendations";
    if (ratingsCount < 5) return "Getting started";
    if (ratingsCount < 15) return "Building your profile";
    if (ratingsCount < 30) return "Profile looking good";
    return "Highly personalized profile";
  };

  const getRatingColor = () => {
    if (ratingsCount === 0) return "text-gray-400";
    if (ratingsCount < 5) return "text-yellow-600";
    if (ratingsCount < 15) return "text-blue-600";
    return "text-green-600";
  };

  const getProgressPercentage = () => {
    // Progress caps at 50 ratings for visual purposes
    // Always show at least 2% so there's a visible starting point
    const percentage = (ratingsCount / 50) * 100;
    return ratingsCount === 0 ? 0 : Math.max(2, Math.min(100, percentage));
  };

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Your Feedback</h3>
          <p className="text-sm text-gray-500">{getStatusMessage()}</p>
        </div>
        <div className={`text-5xl font-bold ${getRatingColor()}`}>
          {ratingsCount}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden relative">
          {ratingsCount === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs text-gray-400 font-medium">Start rating to build your profile</div>
            </div>
          ) : (
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">{gamesAnalyzed}</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Games Analyzed</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900 mb-1">{ratingsCount}</div>
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Games Rated</div>
        </div>
      </div>

      {/* Call to Action */}
      {ratingsCount < 20 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-900">
            {ratingsCount === 0
              ? "Rate recommendations to help us learn your preferences and improve future suggestions"
              : "Keep rating games — your feedback helps us understand your taste better"
            }
          </p>
        </div>
      )}

      {/* View History Link */}
      {ratingsCount > 0 && userId && (
        <div className="mt-6 pt-6 border-t border-gray-100">
          <a
            href={`/profile/history?userId=${userId}`}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-2 group"
          >
            <span>View Rating History</span>
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
  );
}
