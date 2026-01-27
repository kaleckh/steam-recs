'use client';

import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import SearchBar from '@/components/layout/SearchBar';

/**
 * HOMEMADE PAGE
 *
 * Discovery page for indie/solo dev games.
 * Separate search scoped to homemade games.
 *
 * Sections:
 * - Hero search (scoped to homemade)
 * - Featured Picks
 * - Browse by Vibe
 * - Recently Added
 * - Submit Your Game CTA
 *
 * TODO: Wire up the following:
 * 1. Implement search scoped to homemade/indie games
 * 2. Fetch featured homemade games
 * 3. Fetch recently added games
 * 4. Implement game submission flow
 */

// Vibe categories specific to indie games
const INDIE_VIBES = [
  { label: 'Solo Dev', emoji: '👤', query: 'solo developer indie' },
  { label: 'Game Jam', emoji: '🏃', query: 'game jam short' },
  { label: 'Experimental', emoji: '🧪', query: 'experimental unique' },
  { label: 'Pixel Art', emoji: '👾', query: 'pixel art retro' },
  { label: 'Narrative', emoji: '📝', query: 'narrative story indie' },
  { label: 'Atmospheric', emoji: '🌙', query: 'atmospheric ambient' },
];

export default function HomemadePage() {
  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
          {/* Hero Section */}
          <section className="mb-12">
            <div className="terminal-box rounded-lg overflow-hidden">
              <div className="terminal-header">
                <span className="text-gray-400 text-sm font-mono ml-16">HOMEMADE.exe</span>
              </div>
              <div className="p-8 md:p-12 bg-gradient-to-br from-neon-green/5 via-transparent to-neon-orange/5">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-green/10 border border-neon-green/30 rounded-full mb-6">
                    <span>💚</span>
                    <span className="text-neon-green font-mono text-sm">SUPPORT INDIE DEVELOPERS</span>
                  </div>

                  <h1 className="orbitron text-3xl sm:text-4xl font-bold text-white mb-3">
                    Discover Homemade Games
                  </h1>
                  <p className="text-gray-400 font-mono max-w-xl mx-auto">
                    Find hidden gems crafted by solo developers and small teams.
                    Every game here represents someone&apos;s passion project.
                  </p>
                </div>

                {/* Search */}
                <div className="max-w-2xl mx-auto">
                  <SearchBar
                    variant="hero"
                    placeholder="cozy indie game with a heartfelt story..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Featured Picks */}
          <section className="mb-12 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="orbitron text-xl font-bold text-white flex items-center gap-2">
                  <span>⭐</span> Featured Picks
                </h2>
                <p className="text-gray-500 font-mono text-sm">Hand-selected indie gems</p>
              </div>
              <span className="px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan text-xs font-mono rounded-full animate-pulse">
                COMING SOON
              </span>
            </div>

            {/* Coming Soon Overlay */}
            <div className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-50 blur-[2px]">
                <FeaturedGamePlaceholder />
                <FeaturedGamePlaceholder />
                <FeaturedGamePlaceholder />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-[#0a0a0f] via-transparent to-[#0a0a0f]/50">
                <div className="terminal-box rounded-lg p-6 text-center bg-[#0a0a0f]/90 backdrop-blur-sm border-neon-cyan/50">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                    <svg className="w-6 h-6 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-neon-cyan font-mono text-sm mb-2">CURATING INDIE GEMS</p>
                  <p className="text-gray-500 font-mono text-xs">Check back soon for handpicked recommendations</p>
                </div>
              </div>
            </div>
          </section>

          {/* Browse by Vibe */}
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="orbitron text-xl font-bold text-white flex items-center gap-2">
                <span>🎭</span> Browse by Vibe
              </h2>
              <p className="text-gray-500 font-mono text-sm">Find your flavor of indie</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {INDIE_VIBES.map((vibe) => (
                <Link
                  key={vibe.label}
                  href={`/search?q=${encodeURIComponent(vibe.query)}`}
                  className="terminal-box rounded-lg p-4 text-center hover:border-neon-green transition-all group"
                >
                  <span className="text-2xl mb-2 block">{vibe.emoji}</span>
                  <span className="font-mono text-sm text-gray-400 group-hover:text-neon-green transition-colors">
                    {vibe.label}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Recently Added */}
          <section className="mb-12 relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="orbitron text-xl font-bold text-white flex items-center gap-2">
                  <span>🆕</span> Recently Added
                </h2>
                <p className="text-gray-500 font-mono text-sm">Fresh indie releases</p>
              </div>
              <span className="px-3 py-1 bg-neon-green/10 border border-neon-green/50 text-neon-green text-xs font-mono rounded-full animate-pulse">
                COMING SOON
              </span>
            </div>

            {/* Coming Soon Overlay */}
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 opacity-40 blur-[2px]">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="terminal-box rounded-lg overflow-hidden">
                    <div className="aspect-video bg-terminal-dark" />
                    <div className="p-3">
                      <div className="h-4 bg-terminal-border rounded w-3/4 mb-2" />
                      <div className="h-3 bg-terminal-border rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="terminal-box rounded-lg p-5 text-center bg-[#0a0a0f]/90 backdrop-blur-sm border-neon-green/50">
                  <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-neon-green/20 border border-neon-green flex items-center justify-center">
                    <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-neon-green font-mono text-sm">TRACKING NEW RELEASES</p>
                </div>
              </div>
            </div>
          </section>

          {/* Main CTA */}
          <section className="mb-12">
            <div className="terminal-box rounded-lg p-8 text-center bg-gradient-to-br from-neon-cyan/5 via-transparent to-neon-green/5">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="orbitron text-xl font-bold text-white mb-2">
                Can&apos;t Wait?
              </h3>
              <p className="text-gray-400 font-mono max-w-md mx-auto mb-6">
                Use AI Search to discover indie hidden gems right now.
                Just describe what you&apos;re looking for!
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Search for Indie Games
              </Link>
            </div>
          </section>

          {/* Submit Your Game CTA */}
          <section className="mb-12 relative">
            <div className="terminal-box rounded-lg p-8 text-center border-2 border-dashed border-neon-orange/50 bg-gradient-to-br from-neon-orange/5 to-transparent relative overflow-hidden">
              {/* Coming Soon Badge */}
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 bg-neon-orange/10 border border-neon-orange/50 text-neon-orange text-xs font-mono rounded-full animate-pulse">
                  COMING SOON
                </span>
              </div>

              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-orange/20 border border-neon-orange flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>

              <h2 className="orbitron text-2xl font-bold text-white mb-3">
                Are You a Developer?
              </h2>
              <p className="text-gray-400 font-mono mb-6 max-w-md mx-auto">
                Submit your indie game to be discovered by players who are looking for exactly what you made.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/developers#check-ranking"
                  className="px-6 py-3 bg-neon-orange/10 border border-neon-orange text-neon-orange font-mono rounded-lg hover:bg-neon-orange hover:text-black transition-all"
                >
                  Check Your Game&apos;s Ranking
                </Link>
                <Link
                  href="/developers"
                  className="px-6 py-3 text-gray-400 font-mono hover:text-neon-cyan transition-colors"
                >
                  Learn More →
                </Link>
              </div>

              {/* Decorative corner accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-orange/30 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-orange/30 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-orange/30 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-orange/30 rounded-br-lg" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

// Featured game placeholder
function FeaturedGamePlaceholder() {
  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      <div className="aspect-video bg-terminal-dark animate-pulse" />
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-neon-green/20 text-neon-green text-xs font-mono rounded">
            FEATURED
          </span>
        </div>
        <div className="h-5 bg-terminal-border rounded animate-pulse mb-2" />
        <div className="h-4 bg-terminal-border rounded animate-pulse w-3/4 mb-3" />
        <div className="h-3 bg-terminal-border rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}
