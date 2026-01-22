import { GameDetail } from '@/app/game/[appId]/page';

interface GameInfoSidebarProps {
  game: GameDetail;
}

export default function GameInfoSidebar({ game }: GameInfoSidebarProps) {
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;

  // Format review percentage for display
  const getReviewText = (score: number | null) => {
    if (score === null) return null;
    if (score >= 95) return 'Overwhelmingly Positive';
    if (score >= 80) return 'Very Positive';
    if (score >= 70) return 'Positive';
    if (score >= 40) return 'Mixed';
    if (score >= 20) return 'Negative';
    return 'Very Negative';
  };

  const getReviewColor = (score: number | null) => {
    if (score === null) return 'text-[#8f98a0]';
    if (score >= 80) return 'text-[#66c0f4]';
    if (score >= 70) return 'text-[#b2b2b2]';
    return 'text-[#d94141]';
  };

  return (
    <div className="bg-[#16202d] rounded p-6 sticky top-4">
      {/* Header Image */}
      {game.headerImage && (
        <img
          src={game.headerImage}
          alt={game.name}
          className="w-full rounded mb-4"
        />
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-4">{game.name}</h1>

      {/* Overall Reviews */}
      {game.reviewScore !== null && (
        <div className="mb-6">
          <div className="text-[#8f98a0] text-sm mb-2">Overall:</div>
          <div className="flex items-center gap-3">
            <div className={`font-semibold ${getReviewColor(game.reviewScore)}`}>
              {getReviewText(game.reviewScore)}
            </div>
            {game.reviewCount && (
              <div className="text-[#8f98a0] text-sm">
                ({game.reviewCount.toLocaleString()} reviews)
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 h-1 bg-[#2a475e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#66c0f4]"
              style={{ width: `${game.reviewScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Release Date */}
      {game.releaseDate && (
        <div className="mb-4">
          <div className="text-[#8f98a0] text-sm mb-1">Release Date:</div>
          <div className="text-white">
            {typeof game.releaseDate === 'object' && game.releaseDate.date
              ? new Date(game.releaseDate.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : game.releaseYear || 'Unknown'}
          </div>
        </div>
      )}

      {/* Developer */}
      {game.developers && game.developers.length > 0 && (
        <div className="mb-4">
          <div className="text-[#8f98a0] text-sm mb-1">Developer:</div>
          <div className="text-white">{game.developers.join(', ')}</div>
        </div>
      )}

      {/* Publisher */}
      {game.publishers && game.publishers.length > 0 && (
        <div className="mb-4">
          <div className="text-[#8f98a0] text-sm mb-1">Publisher:</div>
          <div className="text-white">{game.publishers.join(', ')}</div>
        </div>
      )}

      {/* Genres */}
      {game.genres && game.genres.length > 0 && (
        <div className="mb-6">
          <div className="text-[#8f98a0] text-sm mb-2">Genres:</div>
          <div className="flex flex-wrap gap-2">
            {game.genres.map((genre, i) => (
              <span
                key={i}
                className="bg-[#2a475e]/50 text-[#c7d5e0] px-3 py-1 rounded text-sm"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* User Tags */}
      {game.tags && game.tags.length > 0 && (
        <div className="mb-6">
          <div className="text-[#8f98a0] text-sm mb-2">User Tags:</div>
          <div className="flex flex-wrap gap-2">
            {game.tags.slice(0, 20).map((tag, i) => {
              // Calculate mock percentage (you can replace with real data if available)
              const percentage = Math.floor(90 - i * 3);
              return (
                <button
                  key={i}
                  className="bg-[#2a475e]/30 hover:bg-[#2a475e]/60 text-[#c7d5e0] px-3 py-1.5 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <span className="text-[#8f98a0] text-xs">{percentage}K</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* View on Steam Button */}
      <a
        href={steamUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-gradient-to-r from-[#06BFFF] to-[#2571CE] hover:from-[#1999FF] hover:to-[#1C5FA8] text-white font-bold py-3 px-4 rounded text-center transition-all"
      >
        View on Steam →
      </a>
    </div>
  );
}
