'use client';

import { useState, useEffect } from 'react';
import { RecommendationFilters } from '@/lib/api-client';

interface FilterControlsProps {
  onFilterChange: (filters: RecommendationFilters) => void;
  isLoading?: boolean;
  currentFilters?: RecommendationFilters;
  compact?: boolean; // For search page use
  isPremium?: boolean;
  onUpgradeClick?: () => void;
}

export default function FilterControls({
  onFilterChange,
  isLoading,
  currentFilters,
  compact = false,
  isPremium = false,
  onUpgradeClick,
}: FilterControlsProps) {
  const [filters, setFilters] = useState<RecommendationFilters>(
    currentFilters || {
      limit: 20,
      excludeOwned: true,
      minReviewScore: 0,
      popularityScore: 50,
    }
  );

  useEffect(() => {
    if (currentFilters) {
      setFilters(currentFilters);
    }
  }, [currentFilters]);

  const handleFilterChange = (
    key: keyof RecommendationFilters,
    value: unknown
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Auto-apply on change
    onFilterChange(newFilters);
  };

  if (compact) {
    // Compact version for search page
    return (
      <div className="flex flex-wrap items-center gap-4">
        {/* Popularity Slider */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            {filters.popularityScore === undefined || filters.popularityScore === 50
              ? 'Balanced'
              : filters.popularityScore < 50
                ? 'Hidden Gems'
                : 'Popular'}
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filters.popularityScore ?? 50}
            onChange={(e) =>
              handleFilterChange('popularityScore', parseInt(e.target.value))
            }
            disabled={isLoading}
            className="w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
          />
        </div>

        {/* Min Review Score */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-500">
            Min {filters.minReviewScore}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={filters.minReviewScore}
            onChange={(e) =>
              handleFilterChange('minReviewScore', parseInt(e.target.value))
            }
            disabled={isLoading}
            className="w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
          />
        </div>

        {/* Free to Play */}
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.isFree === true}
            onChange={(e) =>
              handleFilterChange('isFree', e.target.checked ? true : undefined)
            }
            disabled={isLoading}
            className="w-3.5 h-3.5 rounded border-terminal-border bg-terminal-dark accent-neon-green"
          />
          <span className="text-xs font-mono text-gray-500">Free only</span>
        </label>
      </div>
    );
  }

  // Full version for profile page
  return (
    <div className="w-full max-w-7xl mx-auto mb-6">
      <div
        className={`terminal-box rounded-lg p-5 relative ${!isPremium ? 'cursor-pointer' : ''}`}
        onClick={!isPremium ? onUpgradeClick : undefined}
      >
        {/* Premium Lock Overlay */}
        {!isPremium && (
          <div className="absolute inset-0 bg-terminal-dark/80 backdrop-blur-sm rounded-lg z-10 flex items-center justify-center">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-mono text-sm text-gray-400">Advanced Filters</span>
              <span className="px-2 py-1 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded font-mono">
                PRO
              </span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-4 h-4 text-neon-cyan"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          <span className="text-sm font-mono text-gray-400 uppercase tracking-wider">
            Filters
          </span>
          {!isPremium && (
            <span className="px-1.5 py-0.5 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
              PRO
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Popularity Slider */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              <span className="text-neon-green">&gt;</span> Discovery Mode:{' '}
              <span className={
                filters.popularityScore === undefined || filters.popularityScore === 50
                  ? 'text-gray-400'
                  : filters.popularityScore < 50
                    ? 'text-neon-orange'
                    : 'text-neon-green'
              }>
                {filters.popularityScore === undefined || filters.popularityScore === 50
                  ? 'Balanced'
                  : filters.popularityScore < 50
                    ? 'Hidden Gems'
                    : 'Popular'}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.popularityScore ?? 50}
              onChange={(e) =>
                handleFilterChange('popularityScore', parseInt(e.target.value))
              }
              disabled={isLoading}
              className="slider-retro w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono">
              <span className="text-neon-orange">Hidden Gems</span>
              <span>Balanced</span>
              <span className="text-neon-green">Popular</span>
            </div>
          </div>

          {/* Minimum Review Score */}
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">
              <span className="text-neon-green">&gt;</span> Min Review Score:{' '}
              <span className="text-neon-cyan">{filters.minReviewScore}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={filters.minReviewScore}
              onChange={(e) =>
                handleFilterChange('minReviewScore', parseInt(e.target.value))
              }
              disabled={isLoading}
              className="slider-retro w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono">
              <span>Any</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-wrap gap-6 mt-5 pt-4 border-t border-terminal-border">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${filters.excludeOwned
                ? 'bg-neon-cyan/20 border-neon-cyan'
                : 'border-terminal-border group-hover:border-gray-500'
              }
            `}>
              {filters.excludeOwned && (
                <svg className="w-3 h-3 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={filters.excludeOwned}
              onChange={(e) =>
                handleFilterChange('excludeOwned', e.target.checked)
              }
              disabled={isLoading}
              className="sr-only"
            />
            <span className="text-sm font-mono text-gray-400 group-hover:text-gray-300 transition-colors">
              Exclude owned games
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${filters.isFree === true
                ? 'bg-neon-green/20 border-neon-green'
                : 'border-terminal-border group-hover:border-gray-500'
              }
            `}>
              {filters.isFree === true && (
                <svg className="w-3 h-3 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={filters.isFree === true}
              onChange={(e) =>
                handleFilterChange(
                  'isFree',
                  e.target.checked ? true : undefined
                )
              }
              disabled={isLoading}
              className="sr-only"
            />
            <span className="text-sm font-mono text-gray-400 group-hover:text-gray-300 transition-colors">
              Free to play only
            </span>
          </label>

          {/* Deep Cuts Mode Toggle */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`
              w-5 h-5 rounded border-2 flex items-center justify-center transition-all
              ${filters.maxReviewCount !== undefined
                ? 'bg-neon-orange/20 border-neon-orange'
                : 'border-terminal-border group-hover:border-gray-500'
              }
            `}>
              {filters.maxReviewCount !== undefined && (
                <svg className="w-3 h-3 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <input
              type="checkbox"
              checked={filters.maxReviewCount !== undefined}
              onChange={(e) => {
                if (e.target.checked) {
                  // Enable deep cuts: low popularity, cap review count at 5000
                  const deepCutsFilters = {
                    ...filters,
                    maxReviewCount: 5000,
                    popularityScore: 20,
                  };
                  setFilters(deepCutsFilters);
                  onFilterChange(deepCutsFilters);
                } else {
                  // Disable deep cuts: remove review count cap, reset popularity
                  const normalFilters = {
                    ...filters,
                    maxReviewCount: undefined,
                    popularityScore: 50,
                  };
                  setFilters(normalFilters);
                  onFilterChange(normalFilters);
                }
              }}
              disabled={isLoading}
              className="sr-only"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-gray-400 group-hover:text-gray-300 transition-colors">
                Deep Cuts Mode
              </span>
              <span className="px-1.5 py-0.5 text-[9px] bg-neon-orange/20 text-neon-orange rounded font-mono">
                &lt;5K REVIEWS
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
