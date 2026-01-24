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
    <div className="terminal-box rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">SIMILAR_GAMES.db</span>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-6 orbitron flex items-center gap-2">
          <span className="text-neon-cyan">&gt;</span> SIMILAR GAMES
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {games.map((game) => {
            const similarityPercent = Math.round(game.similarity * 100);

            return (
              <Link
                key={game.appId}
                href={`/game/${game.appId}`}
                className="group card-arcade rounded-lg overflow-hidden"
              >
                {/* Header Image */}
                <div className="relative bg-terminal-dark">
                  {game.headerImage ? (
                    <img
                      src={game.headerImage}
                      alt={game.name}
                      className="w-full aspect-video object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-video bg-terminal-dark flex items-center justify-center">
                      <span className="text-gray-600 text-xs font-mono">NO IMAGE</span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-terminal-dark to-transparent opacity-60" />
                </div>

                {/* Content */}
                <div className="p-3">
                  {/* Title */}
                  <h3 className="text-white text-xs font-medium line-clamp-2 mb-2 group-hover:text-neon-cyan transition-colors min-h-[2rem] orbitron">
                    {game.name}
                  </h3>

                  {/* Match Badge */}
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div
                      className={`px-2 py-0.5 rounded font-bold font-mono ${
                        similarityPercent >= 80
                          ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                          : similarityPercent >= 60
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : 'bg-terminal-border/50 text-gray-400 border border-terminal-border'
                      }`}
                    >
                      {similarityPercent}% MATCH
                    </div>
                  </div>

                  {/* Review Score */}
                  {game.reviewScore !== null && (
                    <div className="flex items-center gap-1 text-xs text-neon-cyan font-mono">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span>{game.reviewScore}%</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="mt-2 text-xs font-mono">
                    {game.isFree ? (
                      <span className="text-neon-green font-bold">FREE</span>
                    ) : game.price ? (
                      <span className="text-white">{game.price}</span>
                    ) : null}
                  </div>
                </div>

                {/* Bottom accent line */}
                <div className="h-0.5 bg-terminal-border overflow-hidden">
                  <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-neon-cyan via-neon-orange to-neon-green transition-all duration-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
