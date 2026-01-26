'use client';

import { useEffect, useRef, useState } from 'react';

export default function HowItWorksSection() {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="pixel-font text-xs text-neon-orange tracking-widest uppercase mb-4 block">
            // TWO WAYS TO DISCOVER
          </span>
          <h2 className="orbitron text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            HOW IT <span className="text-neon-cyan glow-cyan">WORKS</span>
          </h2>
          <p className="text-lg text-gray-400 font-mono max-w-2xl mx-auto">
            <span className="text-neon-green">&gt;</span> Choose your path to finding the perfect game
          </p>
        </div>

        {/* Two Paths */}
        <div className={`grid md:grid-cols-2 gap-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Path 1: AI Search */}
          <div className="terminal-box rounded-lg overflow-hidden group hover:border-neon-cyan transition-all">
            <div className="px-6 py-4 border-b border-terminal-border bg-neon-cyan/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="orbitron text-xl font-bold text-neon-cyan">AI SEARCH</h3>
                  <p className="text-xs text-gray-500 font-mono">Instant Discovery</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-400 font-mono text-sm">
                Describe what you&apos;re looking for in plain English. Our AI understands context, vibes, and comparisons.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan font-mono text-sm">01</span>
                  <div>
                    <p className="text-white font-mono text-sm">Type your request</p>
                    <p className="text-gray-600 text-xs font-mono">&quot;relaxing games like Stardew Valley&quot;</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan font-mono text-sm">02</span>
                  <div>
                    <p className="text-white font-mono text-sm">AI searches 70,000+ games</p>
                    <p className="text-gray-600 text-xs font-mono">Semantic search, not just keywords</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-cyan font-mono text-sm">03</span>
                  <div>
                    <p className="text-white font-mono text-sm">Get instant results</p>
                    <p className="text-gray-600 text-xs font-mono">Ranked by relevance to your query</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-terminal-border">
                <a
                  href="/"
                  className="inline-flex items-center gap-2 text-neon-cyan font-mono text-sm hover:underline"
                >
                  <span>Try AI Search</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Path 2: Personalized Recommendations */}
          <div className="terminal-box rounded-lg overflow-hidden group hover:border-neon-orange transition-all">
            <div className="px-6 py-4 border-b border-terminal-border bg-neon-orange/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neon-orange/20 border border-neon-orange flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="orbitron text-xl font-bold text-neon-orange">PERSONALIZED</h3>
                  <p className="text-xs text-gray-500 font-mono">Based on Your Library</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-gray-400 font-mono text-sm">
                Connect your Steam account. Our AI analyzes your playtime, and learns from your votes to get smarter over time.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-neon-orange font-mono text-sm">01</span>
                  <div>
                    <p className="text-white font-mono text-sm">Enter your Steam ID</p>
                    <p className="text-gray-600 text-xs font-mono">Profile URL or Steam ID</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-orange font-mono text-sm">02</span>
                  <div>
                    <p className="text-white font-mono text-sm">AI builds your taste profile</p>
                    <p className="text-gray-600 text-xs font-mono">From playtime, genres, and patterns</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-orange font-mono text-sm">03</span>
                  <div>
                    <p className="text-white font-mono text-sm">Get personalized picks</p>
                    <p className="text-gray-600 text-xs font-mono">Hidden gems you&apos;ll actually love</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-neon-green font-mono text-sm">04</span>
                  <div>
                    <p className="text-white font-mono text-sm">Vote to teach the AI</p>
                    <p className="text-gray-600 text-xs font-mono">👍 👎 — it learns your exact taste</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-terminal-border">
                <a
                  href="/profile"
                  className="inline-flex items-center gap-2 text-neon-orange font-mono text-sm hover:underline"
                >
                  <span>Connect Steam</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bonus: Combine both */}
        <div className={`mt-12 text-center transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="inline-block terminal-box rounded-lg px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-neon-cyan/20 to-neon-orange/20 border border-neon-green flex items-center justify-center">
                <svg className="w-6 h-6 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-white font-mono text-sm">
                  <span className="text-neon-green font-bold">PRO TIP:</span> Use both together
                </p>
                <p className="text-gray-500 font-mono text-xs">
                  AI Search + Your Library = Results personalized to your taste
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
