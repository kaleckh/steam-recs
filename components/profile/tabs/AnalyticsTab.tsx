'use client';

import { useState, useEffect } from 'react';
import UpgradeModal from '@/components/premium/UpgradeModal';

interface GenreBreakdown {
  genre: string;
  percentage: number;
  hours: number;
}

interface Insight {
  icon: string;
  label: string;
  value: string;
}

interface AnalyticsSummary {
  totalGames: number;
  totalPlaytimeHours: number;
  avgPlaytimeHours: number;
  uniquenessScore: number;
  genreCount: number;
  deepDiveGames: number;
}

interface AnalyticsData {
  genreBreakdown: GenreBreakdown[];
  insights: Insight[];
  summary: AnalyticsSummary;
}

interface AnalyticsTabProps {
  userId: string;
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
  isPremium?: boolean;
}

export default function AnalyticsTab({ userId, gamesAnalyzed, totalPlaytimeHours, isPremium = false }: AnalyticsTabProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data for premium users
  useEffect(() => {
    if (isPremium && userId) {
      setIsLoading(true);
      setError(null);

      fetch(`/api/user/analytics?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAnalyticsData(data.analytics);
          } else {
            setError(data.error || 'Failed to load analytics');
          }
        })
        .catch(err => {
          console.error('Analytics fetch error:', err);
          setError('Failed to load analytics');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isPremium, userId]);

  // Mock analytics data for preview
  const mockGenreBreakdown = [
    { genre: 'Action', percentage: 32, hours: 245 },
    { genre: 'RPG', percentage: 28, hours: 214 },
    { genre: 'Indie', percentage: 18, hours: 138 },
    { genre: 'Strategy', percentage: 12, hours: 92 },
    { genre: 'Adventure', percentage: 10, hours: 76 },
  ];

  const mockInsights = [
    { icon: '🎮', label: 'Favorite Genre', value: 'Action RPG' },
    { icon: '👑', label: 'Most Played', value: 'Counter-Strike 2' },
    { icon: '🔥', label: 'Activity Level', value: 'Very Active' },
    { icon: '🏆', label: 'Deep Dive Rate', value: '34%' },
  ];

  // Use real data for premium users
  const genreBreakdown = analyticsData?.genreBreakdown || mockGenreBreakdown;
  const insights = analyticsData?.insights || mockInsights;
  const summary = analyticsData?.summary;

  // Premium user view
  if (isPremium) {
    if (isLoading) {
      return (
        <div className="space-y-6">
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">ANALYTICS_PRO.exe</span>
              <span className="text-neon-green text-xs font-mono ml-4">PREMIUM</span>
            </div>
            <div className="p-8 flex justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
                </div>
                <p className="text-neon-cyan font-mono text-sm">ANALYZING GAMING DATA...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="space-y-6">
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">ANALYTICS_PRO.exe</span>
            </div>
            <div className="p-8 text-center">
              <div className="text-red-400 font-mono mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-terminal-light border border-terminal-border rounded text-gray-400 hover:text-white font-mono text-sm"
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Premium Stats Overview */}
        <div className="terminal-box rounded-lg overflow-hidden">
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">ANALYTICS_PRO.exe</span>
            <span className="text-neon-green text-xs font-mono ml-4">PREMIUM</span>
          </div>

          <div className="p-6">
            <h3 className="orbitron text-lg font-bold text-white mb-4">
              Your Gaming Profile
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
                <div className="text-3xl font-bold text-neon-cyan orbitron mb-1">
                  {summary?.totalGames || gamesAnalyzed}
                </div>
                <div className="text-xs text-gray-500 font-mono">GAMES IN LIBRARY</div>
              </div>
              <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
                <div className="text-3xl font-bold text-neon-green orbitron mb-1">
                  {summary?.totalPlaytimeHours?.toLocaleString() || (totalPlaytimeHours ? Math.round(totalPlaytimeHours).toLocaleString() : '—')}
                </div>
                <div className="text-xs text-gray-500 font-mono">TOTAL HOURS</div>
              </div>
              <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
                <div className="text-3xl font-bold text-neon-orange orbitron mb-1">
                  {summary?.avgPlaytimeHours || (totalPlaytimeHours && gamesAnalyzed ? Math.round(totalPlaytimeHours / gamesAnalyzed) : '—')}
                </div>
                <div className="text-xs text-gray-500 font-mono">AVG HOURS/GAME</div>
              </div>
              <div className="bg-terminal-dark p-4 rounded-lg border border-neon-cyan/30 text-center">
                <div className="text-3xl font-bold text-neon-cyan orbitron mb-1">
                  {summary?.uniquenessScore || 73}%
                </div>
                <div className="text-xs text-gray-500 font-mono">UNIQUE TASTE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Genre Breakdown */}
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">GENRE_ANALYSIS.exe</span>
            </div>

            <div className="p-6">
              <h3 className="orbitron text-lg font-bold text-white mb-4">
                Genre Breakdown
              </h3>
              <div className="space-y-3">
                {genreBreakdown.slice(0, 8).map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm font-mono mb-1">
                      <span className="text-gray-400">{item.genre}</span>
                      <span className="text-neon-cyan">{item.hours}h ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-terminal-dark rounded overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-neon-cyan to-neon-green transition-all duration-500"
                        style={{ width: `${Math.min(item.percentage * 1.5, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {summary && (
                <div className="mt-4 pt-4 border-t border-terminal-border">
                  <p className="text-xs text-gray-500 font-mono">
                    Played across <span className="text-neon-green">{summary.genreCount}</span> different genres
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Insights */}
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">INSIGHTS.json</span>
            </div>

            <div className="p-6">
              <h3 className="orbitron text-lg font-bold text-white mb-4">
                Quick Insights
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {insights.map((item, i) => (
                  <div key={i} className="bg-terminal-dark p-4 rounded-lg border border-terminal-border hover:border-neon-cyan/50 transition-colors">
                    <div className="text-2xl mb-2">{item.icon}</div>
                    <div className="text-xs text-gray-500 font-mono mb-1">{item.label}</div>
                    <div className="text-neon-cyan font-mono font-bold text-sm truncate" title={item.value}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Deep Dive Stats */}
        {summary && (
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">DEEP_DIVE.log</span>
            </div>

            <div className="p-6">
              <h3 className="orbitron text-lg font-bold text-white mb-4">
                Gaming Dedication
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-xs text-gray-500 font-mono">DEEP DIVE GAMES</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-green orbitron">
                    {summary.deepDiveGames}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    Games with 20+ hours played
                  </div>
                </div>

                <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">📊</span>
                    <span className="text-xs text-gray-500 font-mono">DEDICATION RATE</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-orange orbitron">
                    {summary.totalGames > 0 ? Math.round((summary.deepDiveGames / summary.totalGames) * 100) : 0}%
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    Of your library deeply explored
                  </div>
                </div>

                <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">⚡</span>
                    <span className="text-xs text-gray-500 font-mono">GENRE DIVERSITY</span>
                  </div>
                  <div className="text-2xl font-bold text-neon-cyan orbitron">
                    {summary.genreCount}
                  </div>
                  <div className="text-xs text-gray-500 font-mono mt-1">
                    Unique genres played
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Free user view (locked preview)
  return (
    <div className="space-y-6">
      {/* Premium Banner */}
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">ANALYTICS_PRO.exe</span>
        </div>

        <div className="p-8 text-center relative">
          {/* Lock Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border-2 border-neon-orange/50">
              <svg className="w-10 h-10 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h2 className="orbitron text-2xl font-bold text-white mb-2">
            UNLOCK GAMING ANALYTICS
          </h2>
          <p className="text-gray-400 font-mono text-sm mb-6 max-w-md mx-auto">
            Discover deep insights about your gaming habits, preferences, and patterns with Premium Analytics.
          </p>

          {/* Premium Features List */}
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-8">
            {[
              'Genre breakdown analysis',
              'Playtime patterns',
              'Completion statistics',
              'Gaming personality type',
              'Preference evolution',
              'Comparison with others',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-left">
                <svg className="w-4 h-4 text-neon-green flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-gray-400 font-mono text-xs">{feature}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <button
            className="btn-arcade rounded-lg px-8 py-3 text-lg"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            <span className="flex items-center gap-2">
              UPGRADE TO PREMIUM
              <span className="px-2 py-0.5 text-[10px] bg-neon-green/20 text-neon-green border border-neon-green/50 rounded">
                $5/mo
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Preview Cards (Blurred) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Genre Breakdown Preview */}
        <div className="terminal-box rounded-lg overflow-hidden relative">
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">GENRE_ANALYSIS.exe</span>
          </div>

          <div className="p-6 blur-sm pointer-events-none">
            <h3 className="orbitron text-lg font-bold text-white mb-4">
              Genre Breakdown
            </h3>
            <div className="space-y-3">
              {mockGenreBreakdown.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm font-mono mb-1">
                    <span className="text-gray-400">{item.genre}</span>
                    <span className="text-neon-cyan">{item.percentage}%</span>
                  </div>
                  <div className="h-2 bg-terminal-dark rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-neon-cyan to-neon-green"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-terminal-dark/60">
            <div className="text-center">
              <svg className="w-8 h-8 text-neon-orange mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-neon-orange font-mono text-sm">PREMIUM</span>
            </div>
          </div>
        </div>

        {/* Quick Insights Preview */}
        <div className="terminal-box rounded-lg overflow-hidden relative">
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">INSIGHTS.json</span>
          </div>

          <div className="p-6 blur-sm pointer-events-none">
            <h3 className="orbitron text-lg font-bold text-white mb-4">
              Quick Insights
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {mockInsights.map((item, i) => (
                <div key={i} className="bg-terminal-dark p-4 rounded-lg border border-terminal-border">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-xs text-gray-500 font-mono mb-1">{item.label}</div>
                  <div className="text-neon-cyan font-mono font-bold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-terminal-dark/60">
            <div className="text-center">
              <svg className="w-8 h-8 text-neon-orange mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-neon-orange font-mono text-sm">PREMIUM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Stats (Free) */}
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">BASIC_STATS.log</span>
          <span className="text-neon-green text-xs font-mono ml-4">FREE</span>
        </div>

        <div className="p-6">
          <h3 className="orbitron text-lg font-bold text-white mb-4">
            Your Gaming Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
              <div className="text-3xl font-bold text-neon-cyan orbitron mb-1">
                {gamesAnalyzed}
              </div>
              <div className="text-xs text-gray-500 font-mono">GAMES IN LIBRARY</div>
            </div>
            <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
              <div className="text-3xl font-bold text-neon-green orbitron mb-1">
                {totalPlaytimeHours ? Math.round(totalPlaytimeHours).toLocaleString() : '—'}
              </div>
              <div className="text-xs text-gray-500 font-mono">TOTAL HOURS</div>
            </div>
            <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center">
              <div className="text-3xl font-bold text-neon-orange orbitron mb-1">
                {totalPlaytimeHours && gamesAnalyzed ? Math.round(totalPlaytimeHours / gamesAnalyzed) : '—'}
              </div>
              <div className="text-xs text-gray-500 font-mono">AVG HOURS/GAME</div>
            </div>
            <div className="bg-terminal-dark p-4 rounded-lg border border-terminal-border text-center relative">
              <div className="text-3xl font-bold text-gray-600 orbitron mb-1 blur-sm">
                73%
              </div>
              <div className="text-xs text-gray-500 font-mono">UNIQUE TASTE</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-2 py-1 bg-neon-orange/20 text-neon-orange text-xs font-mono rounded border border-neon-orange/50">
                  PRO
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        userId={userId}
      />
    </div>
  );
}
