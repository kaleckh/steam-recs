'use client';

import { useState, useEffect } from 'react';

interface GenreBreakdown {
  genre: string;
  percent: number;
}

interface TasteDNAData {
  archetype: {
    name: string;
    emoji: string;
    description: string;
  };
  rarityScore: number;
  rarityLabel: string;
  genreBreakdown: GenreBreakdown[];
  topTags: string[];
  favoriteDecade: string;
  stats: {
    totalGames: number;
    totalHours: number;
    avgHoursPerGame: number;
    ratingsGiven: number;
  };
  topGames: Array<{ name: string; playtimeHours: number }>;
}

interface TasteDNAProps {
  userId: string;
  username?: string;
  compact?: boolean;
}

export default function TasteDNA({ userId, username, compact = false }: TasteDNAProps) {
  const [data, setData] = useState<TasteDNAData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchTasteDNA = async () => {
      try {
        const response = await fetch(`/api/user/taste-dna?userId=${userId}`);
        const result = await response.json();

        if (result.success) {
          setData(result.tasteDna);
        }
      } catch (err) {
        console.error('Failed to fetch taste DNA:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasteDNA();
  }, [userId]);

  const handleShare = async () => {
    const shareText = data
      ? `My Gamer DNA: ${data.archetype.emoji} ${data.archetype.name}\n\n` +
        `Top genres: ${data.genreBreakdown.slice(0, 3).map(g => g.genre).join(', ')}\n` +
        `${data.stats.totalHours.toLocaleString()}+ hours across ${data.stats.totalGames} games\n` +
        `Taste rarity: ${data.rarityLabel} (${data.rarityScore}%)\n\n` +
        `Discover your Gamer DNA at steam-recs.com`
      : '';

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Gamer DNA',
          text: shareText,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="terminal-box rounded-lg overflow-hidden animate-pulse">
        <div className="terminal-header">
          <span className="text-purple-400 text-sm font-mono ml-16">TASTE_DNA.exe</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="h-20 bg-terminal-light rounded-lg" />
          <div className="h-32 bg-terminal-light rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (compact) {
    return (
      <button
        onClick={() => setShowShareModal(true)}
        className="w-full terminal-box rounded-lg p-4 hover:border-purple-500/50 transition-all text-left group"
      >
        <div className="flex items-center gap-4">
          <div className="text-4xl">{data.archetype.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-mono text-xs uppercase tracking-wider">
                Your Gamer DNA
              </span>
              <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </div>
            <h3 className="orbitron text-lg font-bold text-white truncate">
              {data.archetype.name}
            </h3>
            <p className="text-gray-500 font-mono text-xs truncate">
              {data.rarityLabel} • {data.stats.totalHours.toLocaleString()}h played
            </p>
          </div>
        </div>
      </button>
    );
  }

  return (
    <>
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-purple-400 text-sm font-mono ml-16">TASTE_DNA.exe</span>
        </div>

        <div className="p-6 space-y-6">
          {/* Archetype Header */}
          <div className="flex items-start gap-4">
            <div className="text-5xl">{data.archetype.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-purple-400 font-mono text-xs uppercase tracking-wider">
                  {username ? `${username}'s` : 'Your'} Gamer Archetype
                </span>
              </div>
              <h2 className="orbitron text-2xl font-black text-white mb-1">
                {data.archetype.name}
              </h2>
              <p className="text-gray-400 font-mono text-sm">
                {data.archetype.description}
              </p>
            </div>
          </div>

          {/* Rarity Score */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 font-mono text-xs uppercase tracking-wider">
                Taste Uniqueness
              </span>
              <span className="text-white font-mono font-bold">
                {data.rarityScore}%
              </span>
            </div>
            <div className="h-2 bg-terminal-dark rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: `${data.rarityScore}%` }}
              />
            </div>
            <p className="text-gray-500 font-mono text-xs mt-2">
              {data.rarityLabel}
            </p>
          </div>

          {/* Genre Breakdown */}
          <div>
            <h3 className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-3">
              Genre DNA
            </h3>
            <div className="space-y-2">
              {data.genreBreakdown.slice(0, 5).map((genre, index) => (
                <div key={genre.genre} className="flex items-center gap-3">
                  <span className="w-20 text-sm font-mono text-gray-400 truncate">
                    {genre.genre}
                  </span>
                  <div className="flex-1 h-3 bg-terminal-dark rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-neon-cyan' :
                        index === 1 ? 'bg-neon-green' :
                        index === 2 ? 'bg-neon-orange' :
                        index === 3 ? 'bg-purple-500' :
                        'bg-gray-500'
                      }`}
                      style={{
                        width: `${genre.percent}%`,
                        animationDelay: `${index * 100}ms`,
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-mono text-gray-500">
                    {genre.percent}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {data.topTags.length > 0 && (
            <div>
              <h3 className="text-gray-400 font-mono text-xs uppercase tracking-wider mb-3">
                Your Vibe
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.topTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-terminal-dark border border-terminal-border text-gray-300 font-mono text-sm rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-terminal-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-cyan font-mono">
                {data.stats.totalGames}
              </div>
              <div className="text-xs text-gray-500 font-mono">Games</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-green font-mono">
                {data.stats.totalHours.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 font-mono">Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-orange font-mono">
                {data.favoriteDecade}
              </div>
              <div className="text-xs text-gray-500 font-mono">Fav Era</div>
            </div>
          </div>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="w-full py-3 bg-purple-500/20 border border-purple-500 text-purple-400 font-mono text-sm rounded-lg hover:bg-purple-500/30 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {copied ? 'COPIED!' : 'SHARE YOUR GAMER DNA'}
          </button>
        </div>
      </div>

      {/* Share Modal - Could expand this later */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          />
          <div className="relative terminal-box rounded-lg p-6 max-w-md w-full">
            <TasteDNA userId={userId} username={username} />
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
