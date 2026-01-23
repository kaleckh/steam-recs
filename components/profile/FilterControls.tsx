'use client';

import { useState, useEffect } from 'react';
import { RecommendationFilters } from '@/lib/api-client';

interface FilterControlsProps {
  onFilterChange: (filters: RecommendationFilters) => void;
  isLoading?: boolean;
  isExpanded: boolean;
  onToggleExpanded: (expanded: boolean) => void;
  currentFilters?: RecommendationFilters;
}

export default function FilterControls({
  onFilterChange,
  isLoading,
  isExpanded,
  onToggleExpanded,
  currentFilters,
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
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="terminal-box rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => onToggleExpanded(!isExpanded)}
          className="w-full terminal-header justify-between hover:bg-terminal-light/50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 ml-16">
            <svg
              className="w-5 h-5 text-neon-cyan"
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
            <span className="orbitron text-sm font-semibold text-gray-300 uppercase tracking-wider">
              FILTER_PARAMS.config
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-neon-cyan transition-transform duration-300 mr-4 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Filter Controls */}
        {isExpanded && (
          <div className="p-6 space-y-6 border-t border-terminal-border animate-slide-up">
            {/* Results Limit */}
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-3">
                <span className="text-neon-green">&gt;</span> RESULT_COUNT:{' '}
                <span className="text-neon-cyan">{filters.limit}</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={filters.limit}
                onChange={(e) =>
                  handleFilterChange('limit', parseInt(e.target.value))
                }
                disabled={isLoading}
                className="slider-retro w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Popularity Slider */}
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-3">
                <span className="text-neon-green">&gt;</span> POPULARITY_MODE:{' '}
                <span className={
                  filters.popularityScore === undefined || filters.popularityScore === 50
                    ? 'text-gray-400'
                    : filters.popularityScore < 50
                      ? 'text-neon-magenta'
                      : 'text-neon-green'
                }>
                  {filters.popularityScore === undefined || filters.popularityScore === 50
                    ? 'BALANCED'
                    : filters.popularityScore < 50
                      ? `HIDDEN_GEMS (${filters.popularityScore})`
                      : `POPULAR (${filters.popularityScore})`}
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
              <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
                <span className="text-neon-magenta">Hidden Gems</span>
                <span>Balanced</span>
                <span className="text-neon-green">Popular</span>
              </div>
            </div>

            {/* Minimum Review Score */}
            <div>
              <label className="block text-sm font-mono text-gray-400 mb-3">
                <span className="text-neon-green">&gt;</span> MIN_REVIEW_SCORE:{' '}
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
              <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
                <span>ANY</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Release Year Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-3">
                  <span className="text-neon-green">&gt;</span> YEAR_MIN
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  placeholder="ANY"
                  value={filters.releaseYearMin || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'releaseYearMin',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                  className="input-terminal w-full rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-3">
                  <span className="text-neon-green">&gt;</span> YEAR_MAX
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  placeholder="ANY"
                  value={filters.releaseYearMax || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'releaseYearMax',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                  className="input-terminal w-full rounded-lg"
                />
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                  ${filters.excludeOwned
                    ? 'bg-neon-cyan/20 border-neon-cyan'
                    : 'border-terminal-border group-hover:border-gray-500'
                  }
                `}>
                  {filters.excludeOwned && (
                    <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  EXCLUDE_OWNED_GAMES
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`
                  w-6 h-6 rounded border-2 flex items-center justify-center transition-all
                  ${filters.isFree === true
                    ? 'bg-neon-green/20 border-neon-green'
                    : 'border-terminal-border group-hover:border-gray-500'
                  }
                `}>
                  {filters.isFree === true && (
                    <svg className="w-4 h-4 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                  FREE_TO_PLAY_ONLY
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4 border-t border-terminal-border">
              <button
                onClick={handleApplyFilters}
                disabled={isLoading}
                className="flex-1 btn-arcade rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
                    APPLYING...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    EXECUTE
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  const defaultFilters: RecommendationFilters = {
                    limit: 20,
                    excludeOwned: true,
                    minReviewScore: 0,
                    popularityScore: 50,
                  };
                  setFilters(defaultFilters);
                  onFilterChange(defaultFilters);
                }}
                disabled={isLoading}
                className="flex-1 btn-arcade btn-arcade-magenta rounded-lg py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  RESET
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
