'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { GameRecommendation, RecommendationFilters } from '@/lib/api-client';

interface DiscoverySectionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: 'cyan' | 'orange' | 'green' | 'magenta' | 'yellow' | 'red';
  filters: Partial<RecommendationFilters>;
  userId?: string;
  games?: GameRecommendation[];
  isLoading?: boolean;
}

const colorClasses = {
  cyan: {
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan',
    text: 'text-neon-cyan',
    glow: 'hover:shadow-[0_0_20px_rgba(0,255,255,0.3)]',
  },
  orange: {
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange',
    text: 'text-neon-orange',
    glow: 'hover:shadow-[0_0_20px_rgba(255,165,0,0.3)]',
  },
  green: {
    bg: 'bg-neon-green/10',
    border: 'border-neon-green',
    text: 'text-neon-green',
    glow: 'hover:shadow-[0_0_20px_rgba(0,255,0,0.3)]',
  },
  magenta: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-400',
    glow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]',
  },
  yellow: {
    bg: 'bg-neon-yellow/10',
    border: 'border-neon-yellow',
    text: 'text-neon-yellow',
    glow: 'hover:shadow-[0_0_20px_rgba(255,255,0,0.3)]',
  },
  red: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    text: 'text-red-400',
    glow: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  },
};

function GameCard({ game, color }: { game: GameRecommendation; color: keyof typeof colorClasses }) {
  const colors = colorClasses[color];
  const matchPercent = Math.round(game.similarity * 100);

  return (
    <Link
      href={`/game/${game.appId}`}
      className={`
        flex-shrink-0 w-[280px] rounded-lg overflow-hidden
        bg-terminal-dark border border-terminal-border
        hover:border-gray-600 ${colors.glow}
        transition-all duration-300 group
      `}
    >
      {/* Game Image */}
      <div className="relative aspect-[460/215] overflow-hidden">
        <img
          src={game.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
          alt={game.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-game.png';
          }}
        />
        {/* Match Score Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded ${colors.bg} ${colors.text} text-xs font-mono font-bold border ${colors.border}`}>
          {matchPercent}% MATCH
        </div>
        {/* Price Badge */}
        {game.price && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-mono">
            {game.price}
          </div>
        )}
      </div>

      {/* Game Info */}
      <div className="p-4">
        <h4 className="font-mono text-sm font-bold text-white truncate group-hover:text-neon-cyan transition-colors">
          {game.name}
        </h4>
        <div className="flex items-center gap-3 mt-2 text-xs font-mono text-gray-500">
          {game.releaseYear && <span>{game.releaseYear}</span>}
          {game.reviewScore && (
            <span className={game.reviewScore >= 80 ? 'text-neon-green' : game.reviewScore >= 60 ? 'text-neon-yellow' : 'text-red-400'}>
              {game.reviewScore}% positive
            </span>
          )}
        </div>
        {game.genres && game.genres.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {game.genres.slice(0, 2).map((genre) => (
              <span key={genre} className="px-2 py-0.5 text-[10px] bg-terminal-light text-gray-400 rounded">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function LoadingCard() {
  return (
    <div className="flex-shrink-0 w-[280px] rounded-lg overflow-hidden bg-terminal-dark border border-terminal-border animate-pulse">
      <div className="aspect-[460/215] bg-terminal-light" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-terminal-light rounded w-3/4" />
        <div className="h-3 bg-terminal-light rounded w-1/2" />
      </div>
    </div>
  );
}

export default function DiscoverySection({
  title,
  description,
  icon,
  color,
  games = [],
  isLoading = false,
}: DiscoverySectionProps) {
  const colors = colorClasses[color];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    setCanScrollLeft(container.scrollLeft > 0);
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 1
    );
  }, []);

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      window.addEventListener('resize', checkScrollability);
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollability);
      }
      window.removeEventListener('resize', checkScrollability);
    };
  }, [checkScrollability, games]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scrollAmount = 600; // Scroll by ~2 cards
    const targetScroll = direction === 'left'
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    });
  };

  return (
    <section className="py-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-6 px-4 md:px-8">
        <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text}`}>
          {icon}
        </div>
        <div>
          <h2 className={`orbitron text-xl md:text-2xl font-bold ${colors.text}`}>
            {title}
          </h2>
          <p className="text-gray-500 font-mono text-sm">
            {description}
          </p>
        </div>
      </div>

      {/* Scrollable Games Row */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          className={`
            absolute left-2 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full
            bg-terminal-dark/90 border border-terminal-border
            flex items-center justify-center
            transition-all duration-200
            ${canScrollLeft
              ? `opacity-0 group-hover:opacity-100 hover:border-${color === 'cyan' ? 'neon-cyan' : color === 'orange' ? 'neon-orange' : color === 'green' ? 'neon-green' : color === 'magenta' ? 'purple-500' : color === 'yellow' ? 'neon-yellow' : 'red-500'} hover:${colors.text} cursor-pointer`
              : 'opacity-0 cursor-default pointer-events-none'}
          `}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          className={`
            absolute right-2 top-1/2 -translate-y-1/2 z-10
            w-10 h-10 rounded-full
            bg-terminal-dark/90 border border-terminal-border
            flex items-center justify-center
            transition-all duration-200
            ${canScrollRight
              ? `opacity-0 group-hover:opacity-100 hover:border-${color === 'cyan' ? 'neon-cyan' : color === 'orange' ? 'neon-orange' : color === 'green' ? 'neon-green' : color === 'magenta' ? 'purple-500' : color === 'yellow' ? 'neon-yellow' : 'red-500'} hover:${colors.text} cursor-pointer`
              : 'opacity-0 cursor-default pointer-events-none'}
          `}
          disabled={!canScrollRight}
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 px-4 md:px-8 scrollbar-thin scrollbar-thumb-terminal-border scrollbar-track-transparent"
        >
          {isLoading ? (
            <>
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </>
          ) : games.length > 0 ? (
            games.map((game) => (
              <GameCard key={game.appId} game={game} color={color} />
            ))
          ) : (
            <div className="flex-shrink-0 w-full py-12 text-center text-gray-500 font-mono">
              No games found for this category
            </div>
          )}
        </div>

        {/* Fade edges */}
        <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-terminal-bg to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-terminal-bg to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
