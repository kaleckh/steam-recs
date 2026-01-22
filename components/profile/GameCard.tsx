'use client';

import { GameRecommendation } from '@/lib/api-client';

interface GameCardProps {
  game: GameRecommendation;
}

export default function GameCard({ game }: GameCardProps) {
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;
  const similarityPercent = Math.round(game.similarity * 100);

  // Determine similarity color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-100';
    if (similarity >= 0.6) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <a
      href={steamUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-gray-200 hover:border-blue-400"
    >
      {/* Header Image */}
      {game.headerImage ? (
        <div className="relative h-48 overflow-hidden bg-gray-200">
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          {/* Similarity Badge */}
          <div className="absolute top-3 right-3">
            <div
              className={`${getSimilarityColor(game.similarity)} px-3 py-1 rounded-full text-sm font-bold shadow-lg`}
            >
              {similarityPercent}% Match
            </div>
          </div>
        </div>
      ) : (
        <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
          <span className="text-gray-500 text-lg font-medium">
            No Image Available
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 space-y-3">
        {/* Game Name */}
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {game.name}
        </h3>

        {/* Genres */}
        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {game.genres.slice(0, 3).map((genre) => (
              <span
                key={genre}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {game.shortDescription && (
          <p className="text-sm text-gray-600 line-clamp-3">
            {game.shortDescription}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {/* Review Score */}
          {game.reviewScore !== null && (
            <div className="flex items-center space-x-1">
              <svg
                className={`w-5 h-5 ${game.reviewScore >= 80 ? 'text-green-600' : game.reviewScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
              <span className="text-sm font-semibold text-gray-700">
                {game.reviewScore}%
              </span>
              {game.reviewCount !== null && (
                <span className="text-xs text-gray-500">
                  ({game.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}

          {/* Release Year */}
          {game.releaseYear && (
            <span className="text-sm text-gray-500">{game.releaseYear}</span>
          )}

          {/* Free Tag */}
          {game.isFree && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">
              FREE
            </span>
          )}
        </div>

        {/* Developers */}
        {game.developers && game.developers.length > 0 && (
          <div className="pt-2">
            <p className="text-xs text-gray-500">
              by {game.developers.slice(0, 2).join(', ')}
            </p>
          </div>
        )}
      </div>
    </a>
  );
}
