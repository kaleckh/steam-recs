import Link from 'next/link';

export const metadata = {
  title: 'About - Steam Recs',
  description: 'About Steam Recs - Built by Kae in Utah',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-terminal-dark">
      {/* Header */}
      <div className="border-b border-terminal-border">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <Link
            href="/"
            className="text-neon-cyan font-mono text-sm hover:underline mb-4 inline-block"
          >
            &larr; Back to Home
          </Link>
          <h1 className="orbitron text-4xl font-bold text-white mb-2">About Steam Recs</h1>
          <p className="text-gray-500 font-mono text-sm">
            The story behind the recommendations
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="space-y-12">

          {/* Creator Section */}
          <section>
            <h2 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2 font-mono">
              <span className="text-neon-green">&gt;</span> The Creator
            </h2>
            <div className="terminal-box rounded-lg p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-green/20 border border-neon-cyan/50 flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl font-bold text-neon-cyan orbitron">K</span>
                </div>
                <div className="space-y-4 font-mono text-gray-300">
                  <p className="text-lg">
                    <span className="text-white font-bold">Hey, I&apos;m Kae!</span> A developer from Utah who&apos;s passionate about AI and gaming.
                  </p>
                  <p>
                    With thousands of hours logged on Steam (probably too many), I know the struggle of finding your next favorite game in a library of 100,000+ titles. Most recommendation systems are either too generic or just show you what&apos;s popular.
                  </p>
                  <p>
                    I wanted something smarter. Something that actually <span className="text-neon-cyan">understands</span> what makes a game special to <span className="italic">you</span>.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Why I Built This */}
          <section>
            <h2 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2 font-mono">
              <span className="text-neon-green">&gt;</span> Why I Built This
            </h2>
            <div className="terminal-box rounded-lg p-6 space-y-4 font-mono text-gray-300">
              <p>
                Steam&apos;s discovery queue is fine, but it doesn&apos;t really get <span className="italic">you</span>. It knows what you&apos;ve played, but not <span className="text-neon-cyan">why</span> you loved it.
              </p>
              <p>
                Did you sink 200 hours into Stardew Valley because you love farming sims? Or because of the cozy atmosphere and meaningful relationships? Those are very different reasons that lead to very different recommendations.
              </p>
              <p>
                Steam Recs uses AI to understand the <span className="text-white font-bold">essence</span> of games &mdash; their themes, mechanics, atmosphere, and what makes them special. Then it finds other games that share those qualities, even if they&apos;re in completely different genres.
              </p>
              <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <p className="text-neon-green text-sm">
                  The goal: Help every gamer find their next obsession, not just their next purchase.
                </p>
              </div>
            </div>
          </section>

          {/* Tech Stack */}
          <section>
            <h2 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2 font-mono">
              <span className="text-neon-green">&gt;</span> How It Works
            </h2>
            <div className="terminal-box rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-white font-bold font-mono flex items-center gap-2">
                    <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    AI-Powered Understanding
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">
                    Every game in our database is analyzed and converted into a semantic embedding &mdash; a mathematical representation of what makes it unique. This captures themes, mechanics, tone, and player experience.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-bold font-mono flex items-center gap-2">
                    <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Vector Search
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">
                    When you search or get recommendations, we use vector similarity to find games that are semantically similar &mdash; not just keyword matches, but games that truly feel alike.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-bold font-mono flex items-center gap-2">
                    <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                    147,000+ Games
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">
                    Our database includes the entire Steam catalog, from AAA blockbusters to hidden indie gems. Every game is indexed and ready to be discovered.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-bold font-mono flex items-center gap-2">
                    <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Your Library, Your Recs
                  </h3>
                  <p className="text-gray-400 font-mono text-sm">
                    Link your Steam account and we&apos;ll analyze what you actually play, not just what you own. More playtime = stronger signal for what you love.
                  </p>
                </div>
              </div>

              {/* Tech Stack List */}
              <div className="mt-8 pt-6 border-t border-terminal-border">
                <h3 className="text-white font-bold font-mono mb-4">Tech Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Next.js',
                    'React',
                    'TypeScript',
                    'PostgreSQL',
                    'pgvector',
                    'OpenAI Embeddings',
                    'Supabase',
                    'Tailwind CSS',
                    'Prisma',
                    'Vercel'
                  ].map((tech) => (
                    <span
                      key={tech}
                      className="px-3 py-1 bg-terminal-light border border-terminal-border rounded text-xs font-mono text-gray-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Disclaimer */}
          <section>
            <div className="terminal-box rounded-lg p-6 border-l-4 border-neon-orange">
              <p className="text-gray-500 font-mono text-sm">
                <span className="text-neon-orange font-bold">Disclaimer:</span> Steam Recs is an independent project and is not affiliated with, endorsed by, or connected to Valve Corporation. Steam and the Steam logo are trademarks of Valve Corporation. All game data is sourced from Steam&apos;s public APIs.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
