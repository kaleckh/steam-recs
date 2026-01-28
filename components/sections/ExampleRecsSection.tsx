'use client';

import { useEffect, useRef, useState } from 'react';

// Real Steam games with their app IDs for header images
const exampleQueries = [
  {
    query: "cozy roguelikes with good progression",
    results: [
      { appId: '1966900', name: 'Dome Keeper', score: 94 },
      { appId: '1942280', name: 'Brotato', score: 91 },
      { appId: '2379780', name: 'Balatro', score: 89 },
      { appId: '1637320', name: 'Cult of the Lamb', score: 87 },
    ]
  },
  {
    query: "atmospheric horror like Resident Evil",
    results: [
      { appId: '268050', name: 'The Evil Within', score: 96 },
      { appId: '214490', name: 'Alien: Isolation', score: 93 },
      { appId: '282140', name: 'SOMA', score: 90 },
      { appId: '238320', name: 'Outlast', score: 88 },
    ]
  },
  {
    query: "relaxing city builders no combat",
    results: [
      { appId: '1658280', name: 'Mini Motorways', score: 95 },
      { appId: '1127500', name: 'Dorfromantik', score: 93 },
      { appId: '1681970', name: 'Townscaper', score: 91 },
      { appId: '600090', name: 'Planet Coaster', score: 88 },
    ]
  }
];

export default function ExampleRecsSection() {
  const [activeExample, setActiveExample] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate examples
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveExample((prev) => (prev + 1) % exampleQueries.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentExample = exampleQueries[activeExample];

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-terminal-dark via-terminal-light/20 to-terminal-dark" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className={`text-center mb-6 sm:mb-8 lg:mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <span className="pixel-font text-[10px] sm:text-xs text-neon-green tracking-widest uppercase mb-2 sm:mb-4 block">
            // SEE IT IN ACTION
          </span>
          <h2 className="orbitron text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-4">
            REAL <span className="text-neon-cyan glow-cyan">RESULTS</span>
          </h2>
          <p className="text-gray-400 font-mono text-sm sm:text-base max-w-xl mx-auto px-4">
            <span className="text-neon-green">&gt;</span> Watch our AI find the perfect games for any request
          </p>
        </div>

        {/* Example Query Tabs */}
        <div className={`flex flex-wrap justify-center gap-2 mb-4 sm:mb-6 lg:mb-8 transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {exampleQueries.map((example, index) => (
            <button
              key={index}
              onClick={() => setActiveExample(index)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-mono text-[10px] sm:text-xs transition-all ${
                activeExample === index
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                  : 'bg-terminal-light text-gray-500 border border-terminal-border hover:border-gray-500 hover:text-gray-300'
              }`}
            >
              {index === 0 && 'Cozy Roguelikes'}
              {index === 1 && 'Horror Games'}
              {index === 2 && 'City Builders'}
            </button>
          ))}
        </div>

        {/* Main Demo Area */}
        <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="terminal-box rounded-xl overflow-hidden">
            {/* Terminal Header */}
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">ai_search_demo.exe</span>
            </div>

            <div className="p-4 sm:p-6 md:p-8">
              {/* Search Query Display */}
              <div className="mb-4 sm:mb-6 lg:mb-8">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-gray-500 font-mono text-xs sm:text-sm">Search Query:</span>
                </div>
                <div className="bg-terminal-dark rounded-lg px-3 sm:px-4 py-2 sm:py-3 border border-terminal-border">
                  <p className="text-white font-mono text-sm sm:text-lg md:text-xl">
                    &quot;{currentExample.query}&quot;
                  </p>
                </div>
              </div>

              {/* Results Label */}
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <span className="text-neon-green font-mono text-xs sm:text-sm">RESULTS</span>
                <div className="flex-1 h-px bg-terminal-border" />
                <span className="text-gray-600 font-mono text-xs">{currentExample.results.length} matches</span>
              </div>

              {/* Game Results Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
                {currentExample.results.map((game, index) => (
                  <div
                    key={game.appId}
                    className="group relative rounded-lg overflow-hidden bg-terminal-dark border border-terminal-border hover:border-neon-cyan transition-all"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    {/* Game Image */}
                    <div className="aspect-[460/215] relative overflow-hidden">
                      <img
                        src={`https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/header.jpg`}
                        alt={game.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Match Score Badge */}
                      <div className="absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black/80 rounded text-[10px] sm:text-xs font-mono text-neon-green border border-neon-green/50">
                        {game.score}%
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="p-2 sm:p-3">
                      <h4 className="text-white font-mono text-xs sm:text-sm truncate group-hover:text-neon-cyan transition-colors">
                        {game.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 hidden sm:flex">
                        <span className="text-xs text-gray-600 font-mono">#{index + 1} result</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-4 sm:mt-6 lg:mt-8 pt-4 sm:pt-6 border-t border-terminal-border flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <p className="text-gray-500 font-mono text-xs sm:text-sm text-center sm:text-left">
                  <span className="text-neon-cyan">70,000+</span> games indexed
                </p>
                <a
                  href="/login"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan rounded-lg font-mono text-xs sm:text-sm hover:bg-neon-cyan hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <span>TRY IT FREE</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 lg:mt-12 transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="terminal-box rounded-lg p-4 sm:p-5 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-white font-mono text-xs sm:text-sm mb-1">Semantic Search</h4>
            <p className="text-gray-600 font-mono text-[10px] sm:text-xs">Understands context, not just keywords</p>
          </div>

          <div className="terminal-box rounded-lg p-4 sm:p-5 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-neon-orange/20 border border-neon-orange/50 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h4 className="text-white font-mono text-xs sm:text-sm mb-1">AI-Powered</h4>
            <p className="text-gray-600 font-mono text-[10px] sm:text-xs">Learns from millions of players</p>
          </div>

          <div className="terminal-box rounded-lg p-4 sm:p-5 text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 rounded-lg bg-neon-green/20 border border-neon-green/50 flex items-center justify-center">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-white font-mono text-xs sm:text-sm mb-1">Instant Results</h4>
            <p className="text-gray-600 font-mono text-[10px] sm:text-xs">Find games in under a second</p>
          </div>
        </div>
      </div>
    </section>
  );
}
