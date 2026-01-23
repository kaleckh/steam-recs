'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Hero() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    router.push('/profile');
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* CRT Effects */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className={`flex flex-col items-center text-center space-y-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* System Status Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 terminal-box rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
            </span>
            <span className="pixel-font text-[10px] text-neon-green tracking-wider uppercase">
              SYSTEM ONLINE
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="orbitron text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-tight tracking-tight">
              <span className="block">FIND YOUR</span>
              <span className="block mt-2">
                <span className="text-neon-cyan glow-cyan">NEXT</span>{' '}
                <span className="text-neon-orange glow-orange">FAVORITE</span>
              </span>
              <span className="block mt-2">GAME</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto font-mono">
              <span className="text-neon-green">&gt;</span> AI-powered recommendations
              <br className="hidden sm:block" />
              based on your Steam library
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex flex-col items-center gap-6">
            <button
              onClick={handleGetStarted}
              className="group relative px-12 py-6 text-xl font-bold overflow-hidden rounded-lg transition-all duration-300"
            >
              {/* Button background */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 to-neon-orange/20 border-2 border-neon-cyan rounded-lg transition-all group-hover:border-neon-orange" />

              {/* Animated sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

              {/* Button content */}
              <span className="relative flex items-center gap-3 orbitron text-neon-cyan group-hover:text-neon-orange transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                GET MY RECOMMENDATIONS
              </span>

              {/* Glow effect */}
              <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 box-glow-cyan" />
            </button>

            {/* Subtext */}
            <div className="flex items-center gap-6 text-sm font-mono">
              <span className="flex items-center gap-2 text-gray-500">
                <span className="text-neon-green">✓</span> Free
              </span>
              <span className="flex items-center gap-2 text-gray-500">
                <span className="text-neon-green">✓</span> No signup
              </span>
              <span className="flex items-center gap-2 text-gray-500">
                <span className="text-neon-green">✓</span> 30 seconds
              </span>
            </div>
          </div>

          {/* Terminal decoration */}
          <div className="w-full max-w-lg mt-8">
            <div className="terminal-box rounded-lg overflow-hidden">
              <div className="terminal-header">
                <span className="text-gray-500 text-xs font-mono ml-16">steam_rec.sh</span>
              </div>
              <div className="p-4 font-mono text-sm">
                <p className="text-gray-500">
                  <span className="text-neon-green">$</span> ./analyze_profile.sh
                </p>
                <p className="text-neon-cyan mt-2 cursor-blink">
                  Awaiting Steam profile input...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
        <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Scroll</span>
        <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
