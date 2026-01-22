import { GameDetail } from '@/app/game/[appId]/page';

interface StatsTabProps {
  game: GameDetail;
}

export default function StatsTab({ game }: StatsTabProps) {
  return (
    <div className="space-y-8">
      {/* About This Game */}
      {game.detailedDescription && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">About This Game</h3>
          <div
            className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: game.detailedDescription }}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Release Info */}
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Release Information</h4>
            <div className="space-y-3 text-sm">
              {game.releaseDate && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Release Date:</span>
                  <span className="text-white">
                    {typeof game.releaseDate === 'object' && game.releaseDate.date
                      ? game.releaseDate.date
                      : String(game.releaseDate)}
                  </span>
                </div>
              )}
              {game.releaseYear && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Year:</span>
                  <span className="text-white">{game.releaseYear}</span>
                </div>
              )}
              {game.developers && game.developers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Developer:</span>
                  <span className="text-white text-right">{game.developers.join(', ')}</span>
                </div>
              )}
              {game.publishers && game.publishers.length > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Publisher:</span>
                  <span className="text-white text-right">{game.publishers.join(', ')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          {game.categories && game.categories.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Features</h4>
              <div className="flex flex-wrap gap-2">
                {game.categories.map((category, i) => (
                  <span
                    key={i}
                    className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Review Stats */}
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Review Statistics</h4>
            <div className="space-y-3 text-sm">
              {game.reviewScore !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">User Score:</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full font-semibold">
                      {game.reviewScore}%
                    </div>
                  </div>
                </div>
              )}
              {game.reviewCount !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Reviews:</span>
                  <span className="text-white">{game.reviewCount.toLocaleString()}</span>
                </div>
              )}
              {game.metacriticScore !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Metacritic Score:</span>
                  <div className="bg-green-600 text-white px-3 py-1 rounded-full font-semibold">
                    {game.metacriticScore}
                  </div>
                </div>
              )}
              {game.recommendations !== null && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Recommendations:</span>
                  <span className="text-white">{game.recommendations.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
            <h4 className="text-lg font-semibold text-white mb-4">Price</h4>
            <div className="space-y-3">
              {game.isFree ? (
                <div className="text-center py-4">
                  <span className="bg-green-600 text-white px-6 py-3 rounded-lg text-2xl font-bold">
                    FREE TO PLAY
                  </span>
                </div>
              ) : game.price ? (
                <div className="text-center py-4">
                  <span className="text-blue-400 text-3xl font-bold">{game.price}</span>
                  {game.discountPercent > 0 && (
                    <div className="mt-2 text-sm text-green-400">
                      {game.discountPercent}% off
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-sm text-center">Price not available</p>
              )}
            </div>
          </div>

          {/* Platform Support */}
          {game.platforms && (
            <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Platforms</h4>
              <div className="flex space-x-4 justify-center">
                {game.platforms.windows && (
                  <div className="text-center">
                    <div className="text-blue-400 text-2xl mb-1">🖥️</div>
                    <span className="text-gray-400 text-xs">Windows</span>
                  </div>
                )}
                {game.platforms.mac && (
                  <div className="text-center">
                    <div className="text-blue-400 text-2xl mb-1">🍎</div>
                    <span className="text-gray-400 text-xs">macOS</span>
                  </div>
                )}
                {game.platforms.linux && (
                  <div className="text-center">
                    <div className="text-blue-400 text-2xl mb-1">🐧</div>
                    <span className="text-gray-400 text-xs">Linux</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      {game.tags && game.tags.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">Popular Tags</h3>
          <div className="flex flex-wrap gap-2">
            {game.tags.slice(0, 20).map((tag, i) => (
              <span
                key={i}
                className="bg-blue-600/20 text-blue-300 px-4 py-2 rounded-full text-sm border border-blue-600/50 hover:bg-blue-600/30 transition-colors cursor-pointer"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* System Requirements */}
      {game.pcRequirements && typeof game.pcRequirements === 'object' && game.pcRequirements.minimum && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-4">System Requirements (PC)</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {game.pcRequirements.minimum && (
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-3">Minimum</h4>
                <div
                  className="text-gray-300 text-sm prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: game.pcRequirements.minimum }}
                />
              </div>
            )}
            {game.pcRequirements.recommended && (
              <div className="bg-gray-900/50 rounded-lg p-6 border border-gray-700">
                <h4 className="text-lg font-semibold text-white mb-3">Recommended</h4>
                <div
                  className="text-gray-300 text-sm prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: game.pcRequirements.recommended }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Website Link */}
      {game.website && (
        <div className="text-center">
          <a
            href={game.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Visit Official Website →
          </a>
        </div>
      )}
    </div>
  );
}
