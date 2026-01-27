import { GameDetail } from '@/app/game/[appId]/page';
import GameVoting from './GameVoting';

interface GameInfoSidebarProps {
  game: GameDetail;
}

export default function GameInfoSidebar({ game }: GameInfoSidebarProps) {
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;

  const getReviewLabel = (score: number | null) => {
    if (score === null) return { text: 'UNKNOWN', color: 'text-gray-500' };
    if (score >= 95) return { text: 'MASTERPIECE', color: 'text-neon-cyan' };
    if (score >= 80) return { text: 'EXCELLENT', color: 'text-neon-green' };
    if (score >= 70) return { text: 'GOOD', color: 'text-neon-yellow' };
    if (score >= 50) return { text: 'MIXED', color: 'text-neon-orange' };
    return { text: 'POOR', color: 'text-red-500' };
  };

  const reviewInfo = getReviewLabel(game.reviewScore);

  return (
    <div className="terminal-box rounded-lg overflow-hidden sticky top-20">
      {/* Terminal Header */}
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">GAME_INFO.dat</span>
      </div>

      <div className="p-6">
        {/* Header Image */}
        {game.headerImage && (
          <div className="mb-6 rounded-lg overflow-hidden border border-terminal-border">
            <img
              src={game.headerImage}
              alt={game.name}
              className="w-full"
            />
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4 orbitron">{game.name}</h1>

        {/* Price Badge */}
        <div className="mb-6">
          {game.isFree ? (
            <span className="inline-block px-4 py-2 bg-neon-green/20 border border-neon-green text-neon-green font-bold rounded-lg orbitron">
              FREE TO PLAY
            </span>
          ) : game.price ? (
            <span className="inline-block px-4 py-2 bg-terminal-dark border border-neon-cyan text-neon-cyan font-bold rounded-lg orbitron">
              {game.price}
            </span>
          ) : null}
        </div>

        {/* Rate This Game */}
        <div className="mb-6">
          <GameVoting appId={game.appId} gameName={game.name} />
        </div>

        {/* Overall Reviews */}
        {game.reviewScore !== null && (
          <div className="mb-6 p-4 bg-terminal-dark rounded-lg border border-terminal-border">
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-2">
              USER REVIEWS
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className={`font-bold orbitron ${reviewInfo.color}`}>
                {reviewInfo.text}
              </span>
              <span className="text-white font-mono">{game.reviewScore}%</span>
            </div>
            <div className="h-2 progress-bar-retro rounded overflow-hidden">
              <div
                className={`h-full ${
                  game.reviewScore >= 80
                    ? 'progress-fill-cyan'
                    : game.reviewScore >= 60
                      ? 'progress-fill-green'
                      : 'bg-neon-orange'
                }`}
                style={{ width: `${game.reviewScore}%` }}
              />
            </div>
            {game.reviewCount && (
              <p className="text-xs text-gray-500 mt-2 font-mono">
                {game.reviewCount.toLocaleString()} reviews
              </p>
            )}
          </div>
        )}

        {/* Game Info Grid */}
        <div className="space-y-4 mb-6">
          {/* Release Date */}
          {game.releaseDate && (
            <div className="flex justify-between items-center py-2 border-b border-terminal-border">
              <span className="text-gray-500 font-mono text-sm">RELEASE</span>
              <span className="text-white font-mono text-sm">
                {typeof game.releaseDate === 'object' && game.releaseDate.date
                  ? new Date(game.releaseDate.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : game.releaseYear || 'Unknown'}
              </span>
            </div>
          )}

          {/* Developer */}
          {game.developers && game.developers.length > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-terminal-border">
              <span className="text-gray-500 font-mono text-sm">DEVELOPER</span>
              <span className="text-neon-cyan font-mono text-sm text-right">
                {game.developers.join(', ')}
              </span>
            </div>
          )}

          {/* Publisher */}
          {game.publishers && game.publishers.length > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-terminal-border">
              <span className="text-gray-500 font-mono text-sm">PUBLISHER</span>
              <span className="text-white font-mono text-sm text-right">
                {game.publishers.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Genres */}
        {game.genres && game.genres.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
              GENRES
            </div>
            <div className="flex flex-wrap gap-2">
              {game.genres.map((genre, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-terminal-dark text-neon-cyan text-xs font-mono rounded border border-terminal-border"
                >
                  {genre.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* User Tags */}
        {game.tags && game.tags.length > 0 && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 font-mono uppercase tracking-wider mb-3">
              POPULAR TAGS
            </div>
            <div className="flex flex-wrap gap-2">
              {game.tags.slice(0, 12).map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-terminal-dark/50 text-gray-400 text-xs font-mono rounded border border-terminal-border hover:border-neon-cyan hover:text-neon-cyan transition-colors cursor-default"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* View on Steam Button */}
        <a
          href={steamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-arcade rounded-lg w-full text-center flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0C5.4 0 0 5.4 0 12c0 5.5 3.7 10.1 8.8 11.5.1-1.2.3-3.1.1-4.4-.3-1.2-1.7-7.4-1.7-7.4s-.4-.9-.4-2.1c0-2 1.2-3.4 2.6-3.4 1.2 0 1.8.9 1.8 2 0 1.2-.8 3-1.2 4.7-.3 1.4.7 2.6 2.1 2.6 2.5 0 4.2-3.2 4.2-7 0-2.9-2-5-4.8-5-3.5 0-5.7 2.6-5.7 5.5 0 1 .3 1.7.8 2.2.2.2.2.3.2.5 0 .2-.1.6-.2.8-.1.3-.3.4-.6.3-1.6-.7-2.4-2.5-2.4-4.5 0-3.4 2.9-7.4 8.6-7.4 4.6 0 7.6 3.3 7.6 6.9 0 4.7-2.6 8.2-6.4 8.2-1.3 0-2.5-.7-2.9-1.5l-.8 3.1c-.3 1-.9 2-1.5 2.8C9.5 23.9 10.7 24 12 24c6.6 0 12-5.4 12-12S18.6 0 12 0z"/>
          </svg>
          VIEW ON STEAM
        </a>
      </div>
    </div>
  );
}
