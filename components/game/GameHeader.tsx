'use client';

import { GameDetail } from '@/app/game/[appId]/page';
import { useRouter } from 'next/navigation';

interface GameHeaderProps {
  game: GameDetail;
}

export default function GameHeader({ game }: GameHeaderProps) {
  const router = useRouter();
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;

  return (
    <div className="relative">
      {/* Background Image */}
      {game.headerImage && (
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full h-full object-cover opacity-20 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-900/90 to-gray-900" />
        </div>
      )}

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-blue-400 hover:text-blue-300 transition-colors text-sm flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left: Header Image */}
          <div className="md:col-span-1">
            {game.headerImage ? (
              <img
                src={game.headerImage}
                alt={game.name}
                className="w-full rounded-lg shadow-2xl"
              />
            ) : (
              <div className="w-full aspect-[460/215] bg-gray-800 rounded-lg flex items-center justify-center">
                <span className="text-gray-500">No image available</span>
              </div>
            )}

            {/* Steam Link */}
            <a
              href={steamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 px-6 rounded-lg text-center shadow-lg transition-all duration-200 hover:shadow-xl"
            >
              View on Steam →
            </a>
          </div>

          {/* Right: Game Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <h1 className="text-5xl font-bold text-white">{game.name}</h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Review Score */}
              {game.reviewScore !== null && (
                <div className="flex items-center space-x-2 bg-gray-800/80 px-4 py-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  <span className="text-white font-semibold">{game.reviewScore}%</span>
                  {game.reviewCount && (
                    <span className="text-gray-400 text-sm">
                      ({game.reviewCount.toLocaleString()} reviews)
                    </span>
                  )}
                </div>
              )}

              {/* Release Year */}
              {game.releaseYear && (
                <div className="bg-gray-800/80 px-4 py-2 rounded-lg">
                  <span className="text-gray-300">{game.releaseYear}</span>
                </div>
              )}

              {/* Metacritic */}
              {game.metacriticScore && (
                <div className="bg-green-900/50 border border-green-600 px-4 py-2 rounded-lg">
                  <span className="text-green-300 font-semibold">
                    Metacritic: {game.metacriticScore}
                  </span>
                </div>
              )}

              {/* Price */}
              {game.isFree ? (
                <div className="bg-green-600 px-4 py-2 rounded-lg">
                  <span className="text-white font-bold">FREE</span>
                </div>
              ) : game.price ? (
                <div className="bg-blue-600 px-4 py-2 rounded-lg">
                  <span className="text-white font-bold">{game.price}</span>
                </div>
              ) : null}
            </div>

            {/* Genres */}
            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {game.genres.slice(0, 5).map((genre, i) => (
                  <span
                    key={i}
                    className="bg-blue-600/20 text-blue-300 px-3 py-1 rounded-full text-sm border border-blue-600/50"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            {/* Short Description */}
            {game.shortDescription && (
              <p className="text-gray-300 text-lg leading-relaxed">
                {game.shortDescription}
              </p>
            )}

            {/* Developers & Publishers */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {game.developers && game.developers.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Developer</span>
                  <span className="text-white">{game.developers.join(', ')}</span>
                </div>
              )}
              {game.publishers && game.publishers.length > 0 && (
                <div>
                  <span className="text-gray-500 block mb-1">Publisher</span>
                  <span className="text-white">{game.publishers.join(', ')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
