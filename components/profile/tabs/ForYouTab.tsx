'use client';

import Link from 'next/link';
import { GameRecommendation, RecommendationFilters } from '@/lib/api-client';
import FilterControls from '@/components/profile/FilterControls';
import RecommendationsList from '@/components/profile/RecommendationsList';
import AlgorithmAccuracy from '@/components/profile/AlgorithmAccuracy';

interface ForYouTabProps {
  userId: string;
  recommendations: GameRecommendation[];
  gamesAnalyzed: number;
  ratingsCount: number;
  filters: RecommendationFilters;
  onFilterChange: (filters: RecommendationFilters) => void;
  isApplyingFilters: boolean;
}

export default function ForYouTab({
  userId,
  recommendations,
  gamesAnalyzed,
  ratingsCount,
  filters,
  onFilterChange,
  isApplyingFilters,
}: ForYouTabProps) {
  return (
    <div className="space-y-8">
      {/* AI Search CTA */}
      <Link
        href="/profile?tab=ai-search"
        className="block terminal-box rounded-lg overflow-hidden group hover:border-neon-cyan transition-all"
      >
        <div className="p-8 bg-gradient-to-r from-neon-cyan/5 via-transparent to-neon-orange/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border-2 border-neon-cyan flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="orbitron text-2xl md:text-3xl font-black text-white mb-2 group-hover:text-neon-cyan transition-colors">
                  PROMPT YOUR PREFERENCE
                </h2>
                <p className="text-gray-400 font-mono text-sm md:text-base">
                  Describe your perfect game in plain English and let AI find it for you
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 bg-neon-cyan/20 border border-neon-cyan text-neon-cyan font-mono text-sm rounded-lg group-hover:bg-neon-cyan group-hover:text-black transition-all">
                TRY AI SEARCH
              </span>
              <svg className="w-6 h-6 text-neon-cyan group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        </div>
      </Link>

      {/* Filters */}
      <FilterControls
        onFilterChange={onFilterChange}
        isLoading={isApplyingFilters}
        currentFilters={filters}
      />

      {/* Loading Spinner for Filter Changes */}
      {isApplyingFilters && (
        <div className="flex justify-center py-12">
          <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-neon-orange/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-transparent border-t-neon-orange rounded-full animate-spin" />
            </div>
            <p className="text-neon-orange font-mono">APPLYING FILTERS...</p>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {!isApplyingFilters && (
        <RecommendationsList
          recommendations={recommendations}
          userId={userId}
        />
      )}

      {/* Algorithm Accuracy - at bottom for improving recommendations */}
      <div className="flex justify-center">
        <div className="w-full max-w-6xl">
          <AlgorithmAccuracy
            ratingsCount={ratingsCount}
            gamesAnalyzed={gamesAnalyzed}
            userId={userId}
          />
        </div>
      </div>
    </div>
  );
}
