'use client';

import { useState } from 'react';
import { RecommendationFilters } from '@/lib/api-client';

interface DiscoveryMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: 'cyan' | 'orange' | 'green' | 'magenta' | 'yellow';
  filters: Partial<RecommendationFilters>;
}

const DISCOVERY_MODES: DiscoveryMode[] = [
  {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    description: 'Highly rated games with fewer reviews',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    color: 'cyan',
    filters: {
      minReviewScore: 80,
      popularityScore: 20, // Low popularity = hidden gems
      releaseYearMin: new Date().getFullYear() - 5,
    },
  },
  {
    id: 'budget-picks',
    name: 'Budget Picks',
    description: 'Great games that won\'t break the bank',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'green',
    filters: {
      minReviewScore: 75,
      isFree: false, // We'll handle price filtering differently
      popularityScore: 50,
    },
  },
  {
    id: 'recent-hits',
    name: 'Recent Hits',
    description: 'Best games from the last 2 years',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    color: 'orange',
    filters: {
      minReviewScore: 80,
      releaseYearMin: new Date().getFullYear() - 2,
      popularityScore: 60,
    },
  },
  {
    id: 'free-to-play',
    name: 'Free to Play',
    description: 'Quality free games worth your time',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
    ),
    color: 'magenta',
    filters: {
      isFree: true,
      minReviewScore: 70,
      popularityScore: 50,
    },
  },
  {
    id: 'all-time-classics',
    name: 'All-Time Classics',
    description: 'Legendary games everyone should play',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    color: 'yellow',
    filters: {
      minReviewScore: 90,
      releaseYearMax: new Date().getFullYear() - 5,
      popularityScore: 80,
    },
  },
  {
    id: 'trending-now',
    name: 'Trending Now',
    description: 'Popular games gaining momentum',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    color: 'orange',
    filters: {
      minReviewScore: 75,
      releaseYearMin: new Date().getFullYear() - 1,
      popularityScore: 70,
    },
  },
];

interface DiscoveryModesProps {
  activeMode: string | null;
  onModeSelect: (mode: DiscoveryMode | null) => void;
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

const colorClasses = {
  cyan: {
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan',
    text: 'text-neon-cyan',
    hoverBg: 'hover:bg-neon-cyan/20',
  },
  orange: {
    bg: 'bg-neon-orange/10',
    border: 'border-neon-orange',
    text: 'text-neon-orange',
    hoverBg: 'hover:bg-neon-orange/20',
  },
  green: {
    bg: 'bg-neon-green/10',
    border: 'border-neon-green',
    text: 'text-neon-green',
    hoverBg: 'hover:bg-neon-green/20',
  },
  magenta: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-400',
    hoverBg: 'hover:bg-purple-500/20',
  },
  yellow: {
    bg: 'bg-neon-yellow/10',
    border: 'border-neon-yellow',
    text: 'text-neon-yellow',
    hoverBg: 'hover:bg-neon-yellow/20',
  },
};

export default function DiscoveryModes({
  activeMode,
  onModeSelect,
  isPremium = false,
  onUpgradeClick,
}: DiscoveryModesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Show first 3 modes always, rest on expand
  const visibleModes = isExpanded ? DISCOVERY_MODES : DISCOVERY_MODES.slice(0, 3);
  const hasMoreModes = DISCOVERY_MODES.length > 3;

  const handleModeClick = (mode: DiscoveryMode) => {
    // Premium modes (can gate specific modes if needed)
    const premiumModes = ['all-time-classics', 'trending-now'];

    if (!isPremium && premiumModes.includes(mode.id)) {
      onUpgradeClick?.();
      return;
    }

    if (activeMode === mode.id) {
      onModeSelect(null); // Deselect
    } else {
      onModeSelect(mode);
    }
  };

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">DISCOVERY_MODES.exe</span>
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="orbitron text-lg font-bold text-white">Quick Discovery</h3>
            <p className="text-gray-500 font-mono text-xs mt-1">
              {activeMode ? 'Click again to clear filter' : 'Select a mode to filter recommendations'}
            </p>
          </div>
          {activeMode && (
            <button
              onClick={() => onModeSelect(null)}
              className="px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white bg-terminal-light rounded border border-terminal-border hover:border-gray-500 transition-all"
            >
              CLEAR
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleModes.map((mode) => {
            const isActive = activeMode === mode.id;
            const colors = colorClasses[mode.color];
            const premiumModes = ['all-time-classics', 'trending-now'];
            const needsPremium = !isPremium && premiumModes.includes(mode.id);

            return (
              <button
                key={mode.id}
                onClick={() => handleModeClick(mode)}
                className={`
                  relative p-4 rounded-lg border text-left transition-all
                  ${isActive
                    ? `${colors.bg} ${colors.border} ${colors.text}`
                    : `bg-terminal-dark border-terminal-border ${colors.hoverBg} hover:border-gray-500`
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isActive ? colors.bg : 'bg-terminal-light'}
                    ${isActive ? colors.text : 'text-gray-500'}
                  `}>
                    {mode.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-mono text-sm font-bold truncate ${isActive ? colors.text : 'text-white'}`}>
                        {mode.name}
                      </h4>
                      {needsPremium && (
                        <span className="px-1.5 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded flex-shrink-0">
                          PRO
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 font-mono mt-1 line-clamp-1">
                      {mode.description}
                    </p>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2">
                    <svg className={`w-4 h-4 ${colors.text}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {hasMoreModes && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-4 w-full py-2 text-center text-xs font-mono text-gray-500 hover:text-neon-cyan transition-colors flex items-center justify-center gap-2"
          >
            {isExpanded ? (
              <>
                Show Less
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </>
            ) : (
              <>
                Show {DISCOVERY_MODES.length - 3} More Modes
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export { DISCOVERY_MODES };
export type { DiscoveryMode };
