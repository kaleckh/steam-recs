'use client';

import { useState } from 'react';
import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function DevelopersPage() {
  const [testQuery, setTestQuery] = useState('');
  const [gameUrl, setGameUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<null | { rank: number; query: string; totalResults: number }>(null);

  const handleCheckRanking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testQuery.trim() || !gameUrl.trim()) return;

    setIsChecking(true);
    // Simulate checking - in production this would hit an API
    await new Promise(resolve => setTimeout(resolve, 2000));
    setResult({
      rank: Math.floor(Math.random() * 50) + 1,
      query: testQuery,
      totalResults: 150,
    });
    setIsChecking(false);
  };

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="orbitron text-lg font-bold text-neon-cyan">STEAM RECS</span>
              <span className="px-2 py-0.5 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded font-mono">
                FOR DEVS
              </span>
            </Link>
            <Link
              href="/"
              className="text-gray-400 hover:text-neon-cyan font-mono text-sm transition-colors"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hook */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full mb-8">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-red-400 font-mono text-sm">THE DISCOVERY PROBLEM</span>
          </div>

          <h1 className="orbitron text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Steam buries{' '}
            <span className="text-neon-orange">90%</span> of indie games.
            <br />
            <span className="text-gray-500">Yours might be one of them.</span>
          </h1>

          <p className="text-gray-400 font-mono text-lg sm:text-xl max-w-2xl mx-auto mb-12">
            Players search by vibes. Steam matches by tags.
            <br />
            <span className="text-neon-cyan">Your game falls through the cracks.</span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#check-ranking"
              className="btn-arcade rounded-lg px-8 py-4 text-lg"
            >
              CHECK YOUR RANKING
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 border border-terminal-border text-gray-400 hover:border-neon-cyan hover:text-neon-cyan font-mono rounded-lg transition-colors"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 border-t border-terminal-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-neon-orange font-mono text-sm uppercase tracking-wider">The Problem</span>
            <h2 className="orbitron text-2xl sm:text-4xl font-bold text-white mt-4">
              Tags don&apos;t capture what makes your game special
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* What players search */}
            <div className="terminal-box rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 border border-neon-cyan flex items-center justify-center">
                  <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="orbitron text-lg font-bold text-neon-cyan">What Players Search</h3>
              </div>
              <div className="space-y-3">
                {[
                  '"cozy roguelike with good progression"',
                  '"games like Vampire Survivors but harder"',
                  '"relaxing management game, no combat"',
                  '"story-rich RPG with meaningful choices"',
                ].map((query, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-terminal-dark rounded border border-terminal-border">
                    <span className="text-neon-green font-mono">&gt;</span>
                    <span className="text-gray-300 font-mono text-sm">{query}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* What Steam matches */}
            <div className="terminal-box rounded-lg p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gray-500/20 border border-gray-500 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="orbitron text-lg font-bold text-gray-500">What Steam Matches</h3>
              </div>
              <div className="space-y-3">
                {[
                  { tags: ['Roguelike', 'Indie', 'Pixel Art'], match: '12%' },
                  { tags: ['Action', 'Roguelike', 'Bullet Hell'], match: '34%' },
                  { tags: ['Simulation', 'Strategy', 'Building'], match: '8%' },
                  { tags: ['RPG', 'Story Rich', 'Choices'], match: '45%' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-terminal-dark rounded border border-terminal-border">
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag, j) => (
                        <span key={j} className="px-2 py-0.5 bg-gray-700 text-gray-400 text-xs font-mono rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-red-400 font-mono text-sm">{item.match} match</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="text-center p-8 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-2xl font-mono text-white mb-2">
              <span className="text-red-400">Result:</span> Your perfect players never find you.
            </p>
            <p className="text-gray-500 font-mono">
              They&apos;re searching for exactly what you made, but Steam can&apos;t understand the nuance.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-terminal-dark/50 border-t border-terminal-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-neon-green font-mono text-sm uppercase tracking-wider">The Solution</span>
            <h2 className="orbitron text-2xl sm:text-4xl font-bold text-white mt-4">
              We understand what your game <span className="text-neon-cyan">actually is</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                ),
                title: 'Semantic Indexing',
                description: 'We analyze your game\'s description, reviews, and gameplay to understand its essence—not just its tags.',
                color: 'neon-cyan',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                ),
                title: 'Natural Language Search',
                description: 'Players describe what they want in plain English. We match them with games that actually fit.',
                color: 'neon-orange',
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ),
                title: 'Real Discovery',
                description: 'Your game surfaces for searches it deserves—even when players don\'t know your name.',
                color: 'neon-green',
              },
            ].map((item, i) => (
              <div key={i} className="terminal-box rounded-lg p-6 text-center">
                <div className={`w-14 h-14 rounded-lg bg-${item.color}/20 border border-${item.color} flex items-center justify-center mx-auto mb-4`}
                  style={{
                    backgroundColor: item.color === 'neon-cyan' ? 'rgba(0, 255, 245, 0.2)' :
                      item.color === 'neon-orange' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(57, 255, 20, 0.2)',
                    borderColor: item.color === 'neon-cyan' ? '#00fff5' :
                      item.color === 'neon-orange' ? '#ff6b35' : '#39ff14',
                  }}
                >
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    style={{
                      color: item.color === 'neon-cyan' ? '#00fff5' :
                        item.color === 'neon-orange' ? '#ff6b35' : '#39ff14',
                    }}
                  >
                    {item.icon}
                  </svg>
                </div>
                <h3 className="orbitron text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 font-mono text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Example */}
          <div className="terminal-box rounded-lg overflow-hidden">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">DISCOVERY_DEMO.exe</span>
            </div>
            <div className="p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
                <div className="flex items-center gap-2 text-neon-green font-mono">
                  <span>&gt;</span>
                  <span>Player searches:</span>
                </div>
                <span className="text-neon-cyan font-mono">&quot;cozy farming game with dungeon crawling&quot;</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { name: 'Your Hidden Gem', match: '94%', highlight: true },
                  { name: 'Stardew Valley', match: '89%', highlight: false },
                  { name: 'Moonlighter', match: '86%', highlight: false },
                ].map((game, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${game.highlight
                      ? 'bg-neon-green/10 border-neon-green'
                      : 'bg-terminal-dark border-terminal-border'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono text-sm ${game.highlight ? 'text-neon-green' : 'text-gray-400'}`}>
                        {game.name}
                      </span>
                      {game.highlight && (
                        <span className="px-1.5 py-0.5 bg-neon-green/20 text-neon-green text-[10px] font-mono rounded">
                          YOUR GAME
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-terminal-border rounded-full overflow-hidden">
                        <div
                          className={`h-full ${game.highlight ? 'bg-neon-green' : 'bg-gray-500'}`}
                          style={{ width: game.match }}
                        />
                      </div>
                      <span className={`font-mono text-sm ${game.highlight ? 'text-neon-green' : 'text-gray-500'}`}>
                        {game.match}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-terminal-border">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            {[
              { value: '150K+', label: 'Games Indexed', color: 'neon-cyan' },
              { value: '47K', label: 'Semantic Searches/Month', color: 'neon-orange' },
              { value: '12K', label: 'Games Discovered via Non-Tag Queries', color: 'neon-green' },
            ].map((stat, i) => (
              <div key={i} className="terminal-box rounded-lg p-8">
                <p className="orbitron text-4xl sm:text-5xl font-bold mb-2"
                  style={{
                    color: stat.color === 'neon-cyan' ? '#00fff5' :
                      stat.color === 'neon-orange' ? '#ff6b35' : '#39ff14',
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-gray-400 font-mono text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="check-ranking" className="py-16 sm:py-24 px-4 sm:px-6 bg-terminal-dark/50 border-t border-terminal-border">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-neon-cyan font-mono text-sm uppercase tracking-wider">Free Tool</span>
            <h2 className="orbitron text-2xl sm:text-4xl font-bold text-white mt-4 mb-4">
              Check how your game ranks
            </h2>
            <p className="text-gray-400 font-mono">
              Enter a search query and your Steam URL to see where you&apos;d appear.
            </p>
          </div>

          <form onSubmit={handleCheckRanking} className="terminal-box rounded-lg p-6 sm:p-8">
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-neon-green">&gt;</span> Search query players might use
                </label>
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder="cozy roguelike with good progression"
                  className="w-full bg-terminal-dark border-2 border-terminal-border rounded-lg py-3 px-4 text-neon-cyan placeholder-gray-600 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-mono text-gray-400 mb-2">
                  <span className="text-neon-green">&gt;</span> Your Steam store URL
                </label>
                <input
                  type="text"
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  placeholder="https://store.steampowered.com/app/123456"
                  className="w-full bg-terminal-dark border-2 border-terminal-border rounded-lg py-3 px-4 text-neon-cyan placeholder-gray-600 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!testQuery.trim() || !gameUrl.trim() || isChecking}
              className="w-full btn-arcade rounded-lg py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? 'CHECKING...' : 'CHECK MY RANKING'}
            </button>

            {result && (
              <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green rounded-lg text-center">
                <p className="text-neon-green font-mono text-lg mb-1">
                  Your game ranks <span className="text-2xl font-bold">#{result.rank}</span>
                </p>
                <p className="text-gray-400 font-mono text-sm">
                  for &quot;{result.query}&quot; out of {result.totalResults} results
                </p>
              </div>
            )}
          </form>

          {/* Paid tiers teaser */}
          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div className="terminal-box rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs font-mono rounded">FREE</span>
                <span className="text-white font-mono">Basic</span>
              </div>
              <ul className="space-y-2 text-sm font-mono text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">✓</span> Check ranking for any query
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">✓</span> See top competing games
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-gray-600">○</span> <span className="text-gray-600">Analytics dashboard</span>
                </li>
              </ul>
            </div>

            <div className="terminal-box rounded-lg p-6 border-neon-orange">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-1 bg-neon-orange/20 text-neon-orange text-xs font-mono rounded">PRO</span>
                <span className="text-white font-mono">Coming Soon</span>
              </div>
              <ul className="space-y-2 text-sm font-mono text-gray-400">
                <li className="flex items-center gap-2">
                  <span className="text-neon-green">✓</span> Everything in Free
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-orange">✓</span> Analytics dashboard
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-orange">✓</span> Verified developer badge
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-neon-orange">✓</span> Priority in search results
                </li>
              </ul>
              <button className="mt-4 w-full py-2 border border-neon-orange text-neon-orange font-mono text-sm rounded hover:bg-neon-orange/10 transition-colors">
                JOIN WAITLIST
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-terminal-border">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-gray-600 font-mono text-sm">
            Questions? <a href="mailto:hello@steamrecs.com" className="text-neon-cyan hover:underline">hello@steamrecs.com</a>
          </p>
        </div>
      </footer>
    </div>
    </>
  );
}
