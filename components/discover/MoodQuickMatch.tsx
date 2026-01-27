'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameRecommendation, getRecommendations } from '@/lib/api-client';

interface MoodOption {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  // Maps to recommendation filters
  filters: {
    genres?: string[];
    tags?: string[];
    minReviewScore?: number;
    popularityScore?: number;
    maxReviewCount?: number;
    releaseYearMin?: number;
  };
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'chill',
    label: 'Chill & Relaxing',
    icon: '🌿',
    color: 'neon-green',
    description: 'Low-stress, cozy games',
    filters: {
      tags: ['Relaxing', 'Casual', 'Cozy', 'Peaceful'],
      minReviewScore: 80,
    },
  },
  {
    id: 'action',
    label: 'Intense Action',
    icon: '💥',
    color: 'neon-orange',
    description: 'Fast-paced adrenaline',
    filters: {
      genres: ['Action'],
      tags: ['Fast-Paced', 'Action', 'Shooter', 'Combat'],
      minReviewScore: 75,
    },
  },
  {
    id: 'story',
    label: 'Deep Story',
    icon: '📖',
    color: 'neon-cyan',
    description: 'Rich narrative experiences',
    filters: {
      tags: ['Story Rich', 'Narrative', 'Choices Matter', 'Atmospheric'],
      minReviewScore: 85,
    },
  },
  {
    id: 'quick',
    label: 'Quick Session',
    icon: '⚡',
    color: 'neon-yellow',
    description: 'Games for 30 mins or less',
    filters: {
      tags: ['Short', 'Casual', 'Arcade', 'Pick Up And Play'],
      minReviewScore: 70,
    },
  },
  {
    id: 'coop',
    label: 'Play Together',
    icon: '👥',
    color: 'neon-green',
    description: 'Co-op & multiplayer fun',
    filters: {
      tags: ['Co-op', 'Multiplayer', 'Local Co-Op', 'Online Co-Op'],
      minReviewScore: 75,
    },
  },
  {
    id: 'challenge',
    label: 'Challenge Me',
    icon: '🏆',
    color: 'red',
    description: 'Difficult but rewarding',
    filters: {
      tags: ['Difficult', 'Souls-like', 'Challenging', 'Hardcore'],
      minReviewScore: 80,
    },
  },
  {
    id: 'hidden',
    label: 'Hidden Gem',
    icon: '💎',
    color: 'neon-cyan',
    description: 'Under-the-radar quality',
    filters: {
      popularityScore: 15,
      maxReviewCount: 3000,
      minReviewScore: 85,
    },
  },
  {
    id: 'new',
    label: 'Something New',
    icon: '✨',
    color: 'neon-orange',
    description: 'Recent releases',
    filters: {
      releaseYearMin: new Date().getFullYear() - 1,
      minReviewScore: 75,
    },
  },
];

interface MoodQuickMatchProps {
  userId: string;
}

export default function MoodQuickMatch({ userId }: MoodQuickMatchProps) {
  const [selectedMood, setSelectedMood] = useState<MoodOption | null>(null);
  const [results, setResults] = useState<GameRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleMoodSelect = async (mood: MoodOption) => {
    setSelectedMood(mood);
    setIsLoading(true);
    setResults([]);

    try {
      const response = await getRecommendations(userId, {
        limit: 6,
        excludeOwned: true,
        minReviewScore: mood.filters.minReviewScore,
        popularityScore: mood.filters.popularityScore,
        maxReviewCount: mood.filters.maxReviewCount,
        releaseYearMin: mood.filters.releaseYearMin,
        genres: mood.filters.genres,
      });

      if (response.success && response.recommendations) {
        setResults(response.recommendations.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to fetch mood recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'neon-green':
        return { bg: 'bg-neon-green/10', border: 'border-neon-green', text: 'text-neon-green' };
      case 'neon-orange':
        return { bg: 'bg-neon-orange/10', border: 'border-neon-orange', text: 'text-neon-orange' };
      case 'neon-cyan':
        return { bg: 'bg-neon-cyan/10', border: 'border-neon-cyan', text: 'text-neon-cyan' };
      case 'neon-yellow':
        return { bg: 'bg-neon-yellow/10', border: 'border-neon-yellow', text: 'text-neon-yellow' };
      case 'red':
        return { bg: 'bg-red-500/10', border: 'border-red-500', text: 'text-red-400' };
      default:
        return { bg: 'bg-gray-500/10', border: 'border-gray-500', text: 'text-gray-400' };
    }
  };

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="terminal-header">
        <span className="text-neon-cyan text-sm font-mono ml-16">MOOD_MATCH.exe</span>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="orbitron text-lg font-bold text-white">
              WHAT ARE YOU IN THE MOOD FOR?
            </h2>
            <p className="text-gray-500 font-mono text-xs">
              Quick-match games to your current vibe
            </p>
          </div>
        </div>

        {/* Mood Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {MOOD_OPTIONS.map((mood) => {
            const colors = getColorClasses(mood.color);
            const isSelected = selectedMood?.id === mood.id;

            return (
              <button
                key={mood.id}
                onClick={() => handleMoodSelect(mood)}
                disabled={isLoading}
                className={`
                  p-3 rounded-lg border transition-all text-left
                  ${isSelected
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : 'bg-terminal-dark border-terminal-border hover:border-gray-600 text-gray-400 hover:text-white'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{mood.icon}</span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wide">
                    {mood.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 line-clamp-1">
                  {mood.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8 gap-3">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-2 border-neon-cyan/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-transparent border-t-neon-cyan rounded-full animate-spin" />
            </div>
            <span className="text-neon-cyan font-mono text-sm">
              Finding {selectedMood?.label.toLowerCase()} games...
            </span>
          </div>
        )}

        {/* Results */}
        {!isLoading && results.length > 0 && selectedMood && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 font-mono text-xs">
                <span className={getColorClasses(selectedMood.color).text}>{selectedMood.icon}</span>
                {' '}Top matches for <span className="text-white">{selectedMood.label}</span>
              </span>
              <button
                onClick={() => {
                  setSelectedMood(null);
                  setResults([]);
                }}
                className="text-gray-500 hover:text-white font-mono text-xs transition-colors"
              >
                [clear]
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {results.map((game, index) => (
                <Link
                  key={game.appId}
                  href={`/game/${game.appId}`}
                  className="group animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-terminal-dark border border-terminal-border group-hover:border-gray-600 transition-all">
                    <img
                      src={game.headerImage || `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-[10px] font-mono text-white">
                      {Math.round(game.similarity * 100)}%
                    </div>
                  </div>
                  <p className="mt-1.5 text-xs font-mono text-gray-400 group-hover:text-white line-clamp-1 transition-colors">
                    {game.name}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state when no mood selected */}
        {!isLoading && results.length === 0 && !selectedMood && (
          <div className="text-center py-4">
            <p className="text-gray-600 font-mono text-sm">
              Select a mood above to get personalized recommendations
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
