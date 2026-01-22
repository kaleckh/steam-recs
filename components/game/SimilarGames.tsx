import Link from 'next/link';
import { SimilarGame } from '@/app/game/[appId]/page';

interface SimilarGamesProps {
  games: SimilarGame[];
}

export default function SimilarGames({ games }: SimilarGamesProps) {
  if (games.length === 0) {
    return null;
  }

  return (
    <div className="bg-[#16202d] rounded p-6">
      <h2 className="text-xl font-bold text-white mb-6">Similar Games</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {games.map((game) => {
          const similarityPercent = Math.round(game.similarity * 100);

          return (
            <Link
              key={game.appId}
              href={`/game/${game.appId}`}
              className="group bg-[#1b2838] rounded overflow-hidden hover:bg-[#2a475e] transition-all"
            >
              {/* Header Image */}
              {game.headerImage ? (
                <img
                  src={game.headerImage}
                  alt={game.name}
                  className="w-full aspect-[460/215] object-cover"
                />
              ) : (
                <div className="w-full aspect-[460/215] bg-[#2a475e] flex items-center justify-center">
                  <span className="text-[#8f98a0] text-xs">No image</span>
                </div>
              )}

              {/* Content */}
              <div className="p-3">
                {/* Title */}
                <h3 className="text-white text-sm font-medium line-clamp-2 mb-2 group-hover:text-[#66c0f4] transition-colors min-h-[2.5rem]">
                  {game.name}
                </h3>

                {/* Match Badge */}
                <div className="flex items-center justify-between text-xs mb-2">
                  <div
                    className={`px-2 py-0.5 rounded font-semibold ${
                      similarityPercent >= 80
                        ? 'bg-[#5c7e10] text-white'
                        : similarityPercent >= 60
                        ? 'bg-[#4c6b22] text-white'
                        : 'bg-[#8f98a0]/20 text-[#8f98a0]'
                    }`}
                  >
                    {similarityPercent}% Match
                  </div>
                </div>

                {/* Review Score */}
                {game.reviewScore !== null && (
                  <div className="flex items-center gap-1 text-xs text-[#66c0f4]">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>{game.reviewScore}%</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-2 text-xs">
                  {game.isFree ? (
                    <span className="text-[#5c7e10] font-semibold">Free</span>
                  ) : game.price ? (
                    <span className="text-white">{game.price}</span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
