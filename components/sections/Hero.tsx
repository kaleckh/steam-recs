'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const exampleSearches = [
  "cozy games like Stardew Valley but with more combat",
  "dark souls but easier and sci-fi",
  "relaxing city builders with no combat",
  "games like Hades with good story",
  "multiplayer survival games for 4 players",
];

export default function Hero() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Redirect logged-in users to profile
  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/profile');
    }
  }, [authLoading, user, router]);

  // Typewriter effect for placeholder
  useEffect(() => {
    const currentExample = exampleSearches[placeholderIndex];

    if (isTyping) {
      if (displayedPlaceholder.length < currentExample.length) {
        const timeout = setTimeout(() => {
          setDisplayedPlaceholder(currentExample.slice(0, displayedPlaceholder.length + 1));
        }, 50);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => setIsTyping(false), 2000);
        return () => clearTimeout(timeout);
      }
    } else {
      if (displayedPlaceholder.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedPlaceholder(displayedPlaceholder.slice(0, -1));
        }, 30);
        return () => clearTimeout(timeout);
      } else {
        setPlaceholderIndex((prev) => (prev + 1) % exampleSearches.length);
        setIsTyping(true);
      }
    }
  }, [displayedPlaceholder, isTyping, placeholderIndex]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // If not logged in, show login prompt
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }

    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleGetRecommendations = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.push('/profile');
  };

  const handleLoginRedirect = () => {
    // Store the search query to resume after login
    if (searchQuery.trim()) {
      sessionStorage.setItem('pendingSearch', searchQuery.trim());
    }
    router.push('/login');
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
        <div className="terminal-box rounded-lg p-8 flex flex-col items-center space-y-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
          </div>
          <p className="text-neon-cyan font-mono text-sm">LOADING...</p>
        </div>
      </section>
    );
  }

  // If user is logged in, they'll be redirected - show nothing briefly
  if (user) {
    return null;
  }

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 relative">
      {/* CRT Effects */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLoginPrompt(false)}
          />
          <div className="relative terminal-box rounded-lg p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="orbitron text-2xl font-bold text-white mb-2">
                SIGN IN TO SEARCH
              </h3>
              <p className="text-gray-400 font-mono text-sm mb-6">
                Create a free account to use AI-powered search and get personalized recommendations
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleLoginRedirect}
                  className="w-full py-3 px-6 bg-neon-cyan text-black font-bold rounded-lg hover:bg-neon-cyan/90 transition-all orbitron"
                >
                  SIGN IN / SIGN UP
                </button>
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="w-full py-3 px-6 bg-terminal-dark border border-terminal-border text-gray-400 font-mono text-sm rounded-lg hover:border-gray-500 hover:text-white transition-all"
                >
                  Maybe later
                </button>
              </div>

              <p className="text-gray-600 font-mono text-xs mt-4">
                Free to sign up • No credit card required
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto relative z-10">
        <div className={`flex flex-col items-center text-center space-y-10 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* System Status Badge */}
          <div className="inline-flex items-center gap-3 px-4 py-2 terminal-box rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-neon-green"></span>
            </span>
            <span className="pixel-font text-[10px] text-neon-green tracking-wider uppercase">
              70,000+ GAMES INDEXED
            </span>
          </div>

          {/* Main Title */}
          <div className="space-y-4 max-w-4xl">
            <h1 className="orbitron text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              <span className="block">FIND GAMES</span>
              <span className="block mt-2">
                <span className="text-neon-cyan glow-cyan">THE WAY</span>{' '}
                <span className="text-neon-orange glow-orange">YOU THINK</span>
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto font-mono">
              <span className="text-neon-green">&gt;</span> Describe what you want. Our AI searches Steam for you.
            </p>
          </div>

          {/* AI Search Box */}
          <form onSubmit={handleSearch} className="w-full max-w-2xl">
            <div className="terminal-box rounded-lg overflow-hidden">
              <div className="terminal-header">
                <span className="text-gray-500 text-xs font-mono ml-16">ai_search.exe</span>
              </div>
              <div className="p-2">
                <div className="flex items-center gap-3 bg-terminal-dark rounded-lg px-4 py-3 border border-terminal-border focus-within:border-neon-cyan transition-colors">
                  <svg className="w-5 h-5 text-neon-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={displayedPlaceholder + '|'}
                    className="flex-1 bg-transparent text-white font-mono placeholder-gray-600 outline-none text-base"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan rounded font-mono text-sm hover:bg-neon-cyan hover:text-black transition-all"
                  >
                    SEARCH
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Example searches */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            <span className="text-gray-600 font-mono text-xs">Try:</span>
            {['roguelikes with good story', 'cozy games no stress', 'like Elden Ring but easier'].map((example) => (
              <button
                key={example}
                onClick={() => setSearchQuery(example)}
                className="px-3 py-1 text-xs font-mono text-gray-500 hover:text-neon-cyan border border-terminal-border hover:border-neon-cyan rounded-full transition-all"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Trust badges - stack on smallest screens */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs sm:text-sm font-mono">
            <span className="flex items-center gap-2 text-gray-500">
              <span className="text-neon-green">✓</span> Free to try
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              <span className="text-neon-green">✓</span> No credit card
            </span>
            <span className="flex items-center gap-2 text-gray-500">
              <span className="text-neon-green">✓</span> Privacy first
            </span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-float">
        <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Scroll</span>
        <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
}
