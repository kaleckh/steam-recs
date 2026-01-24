'use client';

import { useState } from 'react';
import UpgradeModal from '@/components/premium/UpgradeModal';

interface AnalyticsTabProps {
  userId: string;
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
}

export default function AnalyticsTab({ userId, gamesAnalyzed, totalPlaytimeHours }: AnalyticsTabProps) {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  // Mock analytics data for preview
  const mockGenreBreakdown = [
    { genre: 'Action', percentage: 32, hours: 245 },
    { genre: 'RPG', percentage: 28, hours: 214 },
    { genre: 'Indie', percentage: 18, hours: 138 },
    { genre: 'Strategy', percentage: 12, hours: 92 },
    { genre: 'Adventure', percentage: 10, hours: 76 },
  ];

  const mockInsights = [
    { icon: '🎮', label: 'Favorite Genre', value: 'Action RPG', locked: true },
    { icon: '⏰', label: 'Peak Play Time', value: '9PM - 12AM', locked: true },
    { icon: '📅', label: 'Most Active Day', value: 'Saturday', locked: true },
    { icon: '🏆', label: 'Completion Rate', value: '34%', locked: true },
  ];

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
            <span className="text-gray-400 text-sm font-mono ml-16">GENRE_ANALYSIS.log</span>
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
