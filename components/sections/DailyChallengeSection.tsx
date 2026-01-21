interface DailyChallengeSectionProps {
  date?: string;
}

export default function DailyChallengeSection({ date = new Date().toLocaleDateString() }: DailyChallengeSectionProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900" aria-labelledby="challenge-heading">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-block px-4 py-1 bg-purple-600 text-white text-sm font-semibold rounded-full mb-4">
            Daily Challenge
          </div>
          <h2 id="challenge-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Think You Know Steam Games?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Guess prices, compare ratings, and compete on the leaderboard.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Today&apos;s Challenge: {date}
          </p>
        </div>

        {/* Challenge Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 mb-6">
          <div className="flex flex-col items-center space-y-6">
            {/* Game Icon Placeholder */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>

            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Mystery Game #247
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Can you guess the price of today&apos;s featured game?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                aria-label="Play today's challenge"
              >
                Play Now
              </button>
              <button 
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-semibold rounded-lg transition-colors"
                aria-label="View challenge leaderboard"
              >
                Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* Challenge Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">1,247</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Players Today</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">73%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center backdrop-blur-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">247</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Streak</div>
          </div>
        </div>
      </div>
    </section>
  );
}
