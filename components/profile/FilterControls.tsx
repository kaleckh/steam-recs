'use client';

import { useState } from 'react';
import { RecommendationFilters } from '@/lib/api-client';

interface FilterControlsProps {
  onFilterChange: (filters: RecommendationFilters) => void;
  isLoading?: boolean;
}

export default function FilterControls({
  onFilterChange,
  isLoading,
}: FilterControlsProps) {
  const [filters, setFilters] = useState<RecommendationFilters>({
    limit: 20,
    excludeOwned: true,
    minReviewScore: 0,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (
    key: keyof RecommendationFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="w-full max-w-7xl mx-auto mb-8">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg
              className="w-6 h-6 text-blue-600"
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
            <h3 className="text-lg font-semibold text-gray-900">
              Filter Recommendations
            </h3>
          </div>
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
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
          <div className="px-6 py-6 border-t border-gray-200 space-y-6">
            {/* Results Limit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Results: {filters.limit}
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>5</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Minimum Review Score */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Review Score: {filters.minReviewScore}%
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
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Any</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Release Year Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Year (Min)
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  placeholder="Any"
                  value={filters.releaseYearMin || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'releaseYearMin',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Release Year (Max)
                </label>
                <input
                  type="number"
                  min="1990"
                  max={new Date().getFullYear()}
                  placeholder="Any"
                  value={filters.releaseYearMax || ''}
                  onChange={(e) =>
                    handleFilterChange(
                      'releaseYearMax',
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Toggle Filters */}
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.excludeOwned}
                  onChange={(e) =>
                    handleFilterChange('excludeOwned', e.target.checked)
                  }
                  disabled={isLoading}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Exclude games I already own
                </span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
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
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Only free-to-play games
                </span>
              </label>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                const defaultFilters: RecommendationFilters = {
                  limit: 20,
                  excludeOwned: true,
                  minReviewScore: 0,
                };
                setFilters(defaultFilters);
                onFilterChange(defaultFilters);
              }}
              disabled={isLoading}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
