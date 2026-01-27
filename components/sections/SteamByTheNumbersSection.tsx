'use client';

import { useEffect, useState, useRef } from 'react';

interface StatsData {
  games: {
    total: number;
    withReviews: number;
    withPrices: number;
    highReviews: number;
    lowReviews: number;
    zeroReviews: number;
  };
  users: {
    uniqueReviewers: number;
    avgReviewsPerUser: number;
    avgGamesOwned: number;
    medianGamesOwned: number;
  };
}

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

function AnimatedNumber({ value, duration = 2000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayValue(Math.floor(value * eased));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          animate();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, duration, hasAnimated]);

  return <span ref={ref}>{formatNumber(displayValue)}</span>;
}

export default function SteamByTheNumbersSection() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/stats/overview');
        const data = await response.json();

        if (data.success) {
          setStats({
            games: data.games,
            users: data.users,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute inset-0 bg-terminal-dark/50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <span className="pixel-font text-[10px] sm:text-xs text-neon-cyan tracking-widest uppercase mb-2 sm:mb-4 block">
              // DATABASE
            </span>
            <h2 className="orbitron text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-4">
              STEAM BY THE <span className="text-neon-orange glow-orange">NUMBERS</span>
            </h2>
          </div>

          <div className="flex justify-center">
            <div className="terminal-box rounded-lg p-4 sm:p-8 flex items-center gap-3 sm:gap-4">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <div className="absolute inset-0 border-2 border-neon-cyan/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-transparent border-t-neon-cyan rounded-full animate-spin" />
              </div>
              <span className="text-neon-cyan font-mono text-xs sm:text-sm">LOADING STATISTICS...</span>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!stats) {
    return null;
  }

  const gameStats = [
    { label: 'TOTAL_GAMES', value: stats.games.total, color: 'cyan' },
    { label: 'WITH_REVIEWS', value: stats.games.withReviews, color: 'green' },
    { label: 'WITH_PRICES', value: stats.games.withPrices, color: 'orange' },
    { label: '100K+_REVIEWS', value: stats.games.highReviews, color: 'cyan' },
    { label: 'UNDER_1K', value: stats.games.lowReviews, color: 'orange' },
    { label: 'ZERO_REVIEWS', value: stats.games.zeroReviews, color: 'amber' },
  ];

  const userStats = [
    { label: 'UNIQUE_REVIEWERS', value: stats.users.uniqueReviewers, color: 'cyan' },
    { label: 'AVG_REVIEWS', value: stats.users.avgReviewsPerUser, color: 'green' },
    { label: 'AVG_GAMES', value: stats.users.avgGamesOwned, color: 'orange' },
    { label: 'MEDIAN_GAMES', value: stats.users.medianGamesOwned, color: 'cyan' },
  ];

  return (
    <section className="py-12 sm:py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-terminal-dark/50" />
      <div className="absolute inset-0 grid-dots opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <span className="pixel-font text-[10px] sm:text-xs text-neon-cyan tracking-widest uppercase mb-2 sm:mb-4 block">
            // DATABASE
          </span>
          <h2 className="orbitron text-2xl sm:text-4xl md:text-5xl font-black text-white mb-2 sm:mb-4">
            STEAM BY THE <span className="text-neon-orange glow-orange">NUMBERS</span>
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-400 font-mono max-w-2xl mx-auto px-4">
            <span className="text-neon-green">&gt;</span> Real data from millions of players and games
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
          {/* Games Card */}
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-xs sm:text-sm font-mono ml-16">GAMES.stat</span>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="orbitron text-lg sm:text-xl lg:text-2xl font-bold text-white">GAMES</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-mono">Steam library statistics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                {gameStats.map((stat) => (
                  <div key={stat.label} className="bg-terminal-dark rounded-lg p-2 sm:p-4 border border-terminal-border">
                    <div className={`orbitron text-lg sm:text-2xl lg:text-3xl font-bold mb-1 ${
                      stat.color === 'cyan' ? 'text-neon-cyan' :
                      stat.color === 'green' ? 'text-neon-green' :
                      stat.color === 'orange' ? 'text-neon-orange' :
                      'text-neon-amber'
                    }`}>
                      <AnimatedNumber value={stat.value} />
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      {stat.label.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users Card */}
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-xs sm:text-sm font-mono ml-16">USERS.stat</span>
            </div>
            <div className="p-4 sm:p-6 lg:p-8">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="orbitron text-lg sm:text-xl lg:text-2xl font-bold text-white">USERS</h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-mono">Community metrics</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {userStats.map((stat) => (
                  <div key={stat.label} className="bg-terminal-dark rounded-lg p-2 sm:p-4 border border-terminal-border">
                    <div className={`orbitron text-lg sm:text-2xl lg:text-3xl font-bold mb-1 ${
                      stat.color === 'cyan' ? 'text-neon-cyan' :
                      stat.color === 'green' ? 'text-neon-green' :
                      'text-neon-orange'
                    }`}>
                      <AnimatedNumber value={stat.value} />
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase tracking-wider">
                      {stat.label.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Visual bar for engagement */}
              <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-terminal-border">
                <p className="text-[10px] sm:text-xs text-gray-500 font-mono mb-2 sm:mb-3 uppercase tracking-wider">
                  Data quality index
                </p>
                <div className="h-1.5 sm:h-2 progress-bar-retro rounded overflow-hidden">
                  <div className="h-full w-[85%] progress-fill-cyan" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info banner */}
        <div className="terminal-box rounded-lg p-3 sm:p-4 border-l-4 border-l-neon-orange">
          <p className="text-xs sm:text-sm text-gray-400 font-mono">
            <span className="text-neon-orange">[DATA]</span> Statistics updated regularly from Steam&apos;s public API.
            Our database includes comprehensive game metadata, review scores, and pricing information.
          </p>
        </div>
      </div>
    </section>
  );
}
