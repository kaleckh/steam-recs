'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyPick {
  appId: string;
  name: string;
  similarity: number;
  matchPercent: number;
  headerImage: string | null;
  reviewScore: number | null;
  reviewCount: number | null;
  releaseYear: number | null;
  isFree: boolean | null;
  price: string | null;
  genres: string[];
  tags: string[];
  shortDescription: string | null;
  developers: string[];
}

interface DailyDiscoveryProps {
  userId: string;
}

export default function DailyDiscovery({ userId }: DailyDiscoveryProps) {
  const [dailyPick, setDailyPick] = useState<DailyPick | null>(null);
  const [refreshIn, setRefreshIn] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailyPick = async () => {
      try {
        const response = await fetch(`/api/user/daily-discovery?userId=${userId}`);
        const data = await response.json();

        if (data.success) {
          setDailyPick(data.dailyPick);
          setRefreshIn(data.meta.refreshIn.formatted);
        } else {
          setError(data.error);
        }
      } catch (err) {
        setError('Failed to load daily discovery');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDailyPick();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="terminal-box rounded-lg overflow-hidden animate-pulse">
        <div className="terminal-header">
          <span className="text-neon-orange text-sm font-mono ml-16">DAILY_DISCOVERY.exe</span>
        </div>
        <div className="p-8 flex gap-6">
          <div className="w-72 h-36 bg-terminal-light rounded-lg" />
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-terminal-light rounded w-2/3" />
            <div className="h-4 bg-terminal-light rounded w-full" />
            <div className="h-4 bg-terminal-light rounded w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !dailyPick) {
    // Show a placeholder card when daily discovery isn't available
    return (
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-neon-orange text-sm font-mono ml-16">DAILY_DISCOVERY.exe</span>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-orange/20 border-2 border-neon-orange/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-neon-orange" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
            </svg>
          </div>
          <h3 className="orbitron text-lg font-bold text-white mb-2">
            DAILY DISCOVERY
          </h3>
          <p className="text-gray-500 font-mono text-sm max-w-md mx-auto">
            {error || 'Sync your Steam library to get your personalized daily game pick.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="terminal-header">
        <span className="text-neon-orange text-sm font-mono ml-16">DAILY_DISCOVERY.exe</span>
      </div>

      <div className="relative">
        {/* Background image with gradient overlay */}
        <div className="absolute inset-0">
          {dailyPick.headerImage && (
            <img
              src={dailyPick.headerImage}
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-terminal-dark via-terminal-dark/95 to-terminal-dark/80" />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center">
          {/* Daily pick badge */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-orange/20 border border-neon-orange rounded-full">
              <svg className="w-4 h-4 text-neon-orange animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
              </svg>
              <span className="text-neon-orange font-mono text-xs font-bold">
                YOUR DAILY PICK
              </span>
            </div>
          </div>

          {/* Game image */}
          <Link href={`/game/${dailyPick.appId}`} className="flex-shrink-0 group">
            <div className="relative">
              <img
                src={dailyPick.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${dailyPick.appId}/header.jpg`}
                alt={dailyPick.name}
                className="w-64 md:w-72 h-auto rounded-lg shadow-xl shadow-neon-orange/20 group-hover:shadow-neon-orange/40 transition-all group-hover:scale-[1.02]"
              />
              <div className="absolute top-2 right-2 bg-neon-orange text-black px-2.5 py-1 rounded-full text-sm font-mono font-bold">
                {dailyPick.matchPercent}% MATCH
              </div>
              {dailyPick.price && (
                <div className="absolute bottom-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs font-mono">
                  {dailyPick.isFree ? 'FREE' : dailyPick.price}
                </div>
              )}
            </div>
          </Link>

          {/* Game info */}
          <div className="flex-1 text-center md:text-left pt-4 md:pt-0">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-neon-orange font-mono text-xs uppercase tracking-wider">
                Curated just for you
              </span>
            </div>

            <Link href={`/game/${dailyPick.appId}`}>
              <h2 className="orbitron text-xl md:text-3xl font-black text-white mb-2 hover:text-neon-orange transition-colors">
                {dailyPick.name}
              </h2>
            </Link>

            {dailyPick.shortDescription && (
              <p className="text-gray-400 font-mono text-sm mb-4 line-clamp-2 max-w-xl">
                {dailyPick.shortDescription}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-mono mb-4">
              {dailyPick.reviewScore && (
                <span className={`${dailyPick.reviewScore >= 80 ? 'text-neon-green' : dailyPick.reviewScore >= 60 ? 'text-neon-yellow' : 'text-red-400'}`}>
                  {dailyPick.reviewScore}% Positive
                </span>
              )}
              {dailyPick.releaseYear && (
                <span className="text-gray-500">{dailyPick.releaseYear}</span>
              )}
              {dailyPick.genres.length > 0 && (
                <span className="text-gray-500">
                  {dailyPick.genres.slice(0, 2).join(' · ')}
                </span>
              )}
            </div>

            {dailyPick.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 justify-center md:justify-start">
                {dailyPick.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs bg-terminal-light border border-terminal-border text-gray-400 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
              <Link
                href={`/game/${dailyPick.appId}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neon-orange text-black font-mono font-bold rounded-lg hover:bg-neon-yellow transition-colors"
              >
                VIEW GAME
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>

              {/* Share Buttons */}
              <div className="flex items-center gap-2">
                {/* Twitter/X Share */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`My daily game pick: ${dailyPick.name} (${dailyPick.matchPercent}% match!) 🎮\n\nFind your perfect games at`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-terminal-dark border border-terminal-border hover:border-gray-500 text-gray-400 hover:text-white transition-all"
                  title="Share on X"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Copy Link */}
                <button
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/game/${dailyPick.appId}`;
                    navigator.clipboard.writeText(url);
                  }}
                  className="p-2 rounded-lg bg-terminal-dark border border-terminal-border hover:border-gray-500 text-gray-400 hover:text-white transition-all"
                  title="Copy link"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>

              <span className="text-gray-500 font-mono text-xs">
                New pick in {refreshIn}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
