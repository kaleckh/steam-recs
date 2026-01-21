import ChartPlaceholder from '../ui/ChartPlaceholder';

interface SteamByTheNumbersSectionProps {
  topGamesCount?: number;
  totalReviews?: number;
  avgRating?: number;
}

export default function SteamByTheNumbersSection({ 
  topGamesCount = 100,
  totalReviews = 97000000,
  avgRating = 4.2
}: SteamByTheNumbersSectionProps) {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-800" aria-labelledby="numbers-heading">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 id="numbers-heading" className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Steam by the Numbers
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            See which games top the charts—and which ones flopped. Real data from millions of players.
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">
              {topGamesCount}+
            </div>
            <div className="text-sm font-medium text-blue-700 dark:text-blue-200">
              Top Rated Games
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-green-900 dark:text-green-100 mb-2">
              {(totalReviews / 1000000).toFixed(0)}M+
            </div>
            <div className="text-sm font-medium text-green-700 dark:text-green-200">
              Total Reviews
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 rounded-lg p-6 text-center">
            <div className="text-4xl font-bold text-purple-900 dark:text-purple-100 mb-2">
              {avgRating.toFixed(1)}
            </div>
            <div className="text-sm font-medium text-purple-700 dark:text-purple-200">
              Average Rating
            </div>
          </div>
        </div>

        {/* Chart Placeholders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartPlaceholder
            title="Most Popular Games This Month"
            description="Top games by player count and reviews"
            height="h-80"
          />
          <ChartPlaceholder
            title="Rating Distribution"
            description="How games are rated across Steam"
            height="h-80"
          />
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/stats" 
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            aria-label="View full Steam statistics"
          >
            View Stats
          </a>
        </div>
      </div>
    </section>
  );
}
