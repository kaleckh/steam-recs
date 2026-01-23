'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-12 animate-slide-up">
      <div className="terminal-box rounded-lg overflow-hidden">
        {/* Terminal Header - Error Style */}
        <div className="bg-gradient-to-r from-red-900/50 to-terminal-mid border-b border-red-500/30 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <div className="w-3 h-3 rounded-full bg-neon-yellow" />
            <div className="w-3 h-3 rounded-full bg-gray-600" />
          </div>
          <span className="text-red-400 text-sm font-mono ml-4">FATAL_ERROR.log</span>
        </div>

        {/* Error Body */}
        <div className="p-8">
          {/* Glitch Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-lg bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center glitch-hover">
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              {/* Glitch overlay effect */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 bg-red-500/20 translate-x-0.5 translate-y-0.5" />
                <div className="absolute inset-0 bg-cyan-500/20 -translate-x-0.5 -translate-y-0.5" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="text-center mb-8">
            <h2 className="orbitron text-2xl font-bold text-red-400 mb-4 glow-magenta">
              SYSTEM FAILURE
            </h2>
            <div className="bg-terminal-dark rounded-lg p-4 border border-red-500/20">
              <p className="text-red-300 font-mono text-sm">
                <span className="text-gray-500">&gt;</span> ERROR: {error}
              </p>
            </div>
          </div>

          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full btn-arcade btn-arcade-magenta rounded-lg py-4 text-lg mb-8"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                RETRY_OPERATION
              </span>
            </button>
          )}

          {/* Troubleshooting */}
          <div className="bg-terminal-dark rounded-lg p-6 border border-terminal-border">
            <h3 className="text-sm font-mono text-neon-yellow mb-4 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              TROUBLESHOOTING_GUIDE
            </h3>
            <ul className="space-y-2 font-mono text-sm">
              <li className="flex items-start gap-3 text-gray-400">
                <span className="text-neon-cyan">[1]</span>
                <span>Verify Steam profile is set to PUBLIC</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <span className="text-neon-cyan">[2]</span>
                <span>Check Steam ID format: 17 digits (76561198012345678)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <span className="text-neon-cyan">[3]</span>
                <span>Profile URL must include steamcommunity.com</span>
              </li>
              <li className="flex items-start gap-3 text-gray-400">
                <span className="text-neon-cyan">[4]</span>
                <span>Game details visibility must be enabled</span>
              </li>
            </ul>
          </div>

          {/* Stack trace style decoration */}
          <div className="mt-6 text-[10px] text-gray-700 font-mono overflow-hidden">
            <p>at ProfileAnalyzer.connect (steam-api.ts:42)</p>
            <p>at async IngestService.process (ingest.ts:127)</p>
            <p>at async UserController.analyze (user.ts:89)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
