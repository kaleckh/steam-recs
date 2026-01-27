'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameRecommendation, submitFeedback } from '@/lib/api-client';

interface GameCardProps {
  game: GameRecommendation;
  userId?: string;
  onNotInterested?: (appId: string) => void;
}

export default function GameCard({ game, userId, onNotInterested }: GameCardProps) {
  const [isHidden, setIsHidden] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const gameUrl = `/game/${game.appId}`;

  const getReviewLabel = (score: number) => {
    if (score >= 95) return { text: 'MASTERPIECE', color: 'text-neon-cyan' };
    if (score >= 80) return { text: 'EXCELLENT', color: 'text-neon-green' };
    if (score >= 70) return { text: 'GOOD', color: 'text-neon-yellow' };
    if (score >= 50) return { text: 'MIXED', color: 'text-neon-orange' };
    return { text: 'POOR', color: 'text-red-500' };
  };

  const reviewInfo = game.reviewScore ? getReviewLabel(game.reviewScore) : null;

  const handleNotInterested = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await submitFeedback(userId, game.appId, 'not_interested');
      if (result.success) {
        setIsHidden(true);
        onNotInterested?.(game.appId);
      }
    } catch (error) {
      console.error('Failed to submit not interested:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animate out when hidden
  if (isHidden) {
    return (
      <div className="card-arcade rounded-lg overflow-hidden opacity-0 scale-95 transition-all duration-300">
        <div className="aspect-video bg-terminal-dark" />
        <div className="p-4 h-32" />
      </div>
    );
  }

  return (
    <div className="card-arcade rounded-lg overflow-hidden group relative">
      {/* Not Interested Button - always visible on mobile (touch), hover on desktop */}
      {userId && (
        <button
          onClick={handleNotInterested}
          disabled={isSubmitting}
          className="absolute top-2 left-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 p-2 sm:p-1.5 rounded-full bg-terminal-dark/90 border border-terminal-border hover:border-red-500 hover:bg-red-500/20 active:bg-red-500/30 text-gray-400 hover:text-red-400"
          title="Not interested"
        >
          {isSubmitting ? (
            <svg className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>
      )}

      <Link
        href={gameUrl}
        className="block"
      >
        {/* Header Image */}
        <div className="relative aspect-video overflow-hidden bg-terminal-dark">
          {game.headerImage ? (
            <>
              <img
                src={game.headerImage}
                alt={game.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-terminal-dark via-transparent to-transparent opacity-60" />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="pixel-font text-[8px] text-terminal-border">NO IMAGE</span>
            </div>
          )}

          {/* Price Badge */}
          <div className="absolute top-2 right-2">
            {game.isFree ? (
              <span className="px-2 py-1 bg-neon-green/90 text-black text-xs font-bold rounded uppercase">
                FREE
              </span>
            ) : game.price && (
              <span className="px-2 py-1 bg-terminal-dark/90 text-white text-xs font-bold rounded border border-terminal-border">
                {game.price}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Game Name */}
          <h3 className="text-sm font-semibold text-gray-200 line-clamp-1 group-hover:text-neon-cyan transition-colors orbitron">
            {game.name}
          </h3>

          {/* Description */}
          {game.shortDescription && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed font-mono">
              {game.shortDescription}
            </p>
          )}

          {/* Genres */}
          {game.genres && game.genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {game.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 bg-terminal-dark text-neon-cyan/70 text-[10px] rounded font-mono border border-terminal-border"
                >
                  {genre.toUpperCase()}
                </span>
              ))}
              {game.genres.length > 3 && (
                <span className="px-2 py-0.5 text-gray-600 text-[10px] font-mono">
                  +{game.genres.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Review Score */}
          {game.reviewScore !== null && reviewInfo && (
            <div className="pt-2 border-t border-terminal-border">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold uppercase tracking-wide ${reviewInfo.color}`}>
                  {reviewInfo.text}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {game.reviewScore}%
                </span>
              </div>
              <div className="h-1.5 progress-bar-retro rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
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
                <p className="text-[10px] text-gray-600 mt-1 font-mono">
                  {game.reviewCount.toLocaleString()} reviews
                </p>
              )}
            </div>
          )}
        </div>

        {/* Bottom accent line animation on hover */}
        <div className="h-0.5 bg-terminal-border overflow-hidden">
          <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-neon-cyan via-neon-orange to-neon-green transition-all duration-500" />
        </div>
      </Link>
    </div>
  );
}
