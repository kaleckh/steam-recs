'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface UnplayedGem {
  appId: string;
  name: string;
  playtimeMinutes: number;
  playtimeFormatted: string;
  similarity: number;
  matchPercent: number;
  headerImage: string | null;
  reviewScore: number | null;
  genres: string[];
  reason: string;
}

interface UnplayedGemsProps {
  userId: string;
}

export default function UnplayedGems({ userId }: UnplayedGemsProps) {
  const [gems, setGems] = useState<UnplayedGem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchGems = async () => {
      try {
        const response = await fetch(`/api/user/unplayed-gems?userId=${userId}&limit=8`);
        const data = await response.json();

        if (data.success) {
          setGems(data.gems);
        }
      } catch (err) {
        console.error('Failed to fetch unplayed gems:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGems();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-neon-green text-sm font-mono ml-16">HIDDEN_IN_LIBRARY.exe</span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[460/215] bg-terminal-light rounded-lg mb-2" />
                <div className="h-4 bg-terminal-light rounded w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (gems.length === 0) {
    return null;
  }

  const displayedGems = isExpanded ? gems : gems.slice(0, 4);

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="terminal-header">
        <span className="text-neon-green text-sm font-mono ml-16">HIDDEN_IN_LIBRARY.exe</span>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h3 className="orbitron text-lg font-bold text-white">
                HIDDEN IN YOUR LIBRARY
              </h3>
              <p className="text-gray-500 font-mono text-xs">
                Games you own but haven&apos;t played that match your taste
              </p>
            </div>
          </div>
          <span className="px-2 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono rounded">
            {gems.length} FOUND
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayedGems.map((gem, index) => (
            <Link
              key={gem.appId}
              href={`/game/${gem.appId}`}
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative aspect-[460/215] rounded-lg overflow-hidden mb-2 border border-terminal-border group-hover:border-neon-green/50 transition-all">
                <img
                  src={gem.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${gem.appId}/header.jpg`}
                  alt={gem.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between">
                    <span className="text-neon-green font-mono text-xs font-bold">
                      {gem.matchPercent}% MATCH
                    </span>
                    {gem.playtimeMinutes === 0 ? (
                      <span className="text-neon-orange font-mono text-xs">
                        NEVER PLAYED
                      </span>
                    ) : (
                      <span className="text-gray-400 font-mono text-xs">
                        {gem.playtimeFormatted}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <h4 className="font-mono text-sm text-white truncate group-hover:text-neon-green transition-colors">
                {gem.name}
              </h4>
              <p className="font-mono text-xs text-gray-500 truncate">
                {gem.genres.slice(0, 2).join(' · ') || 'Unknown genre'}
              </p>
            </Link>
          ))}
        </div>

        {gems.length > 4 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-4 py-2 text-center text-gray-400 hover:text-neon-green font-mono text-sm transition-colors"
          >
            {isExpanded ? 'Show less' : `Show ${gems.length - 4} more hidden gems`}
          </button>
        )}
      </div>
    </div>
  );
}
