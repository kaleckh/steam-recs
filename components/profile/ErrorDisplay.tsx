'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

// Determine error type for contextual help
function getErrorType(error: string): 'private_profile' | 'invalid_id' | 'no_games' | 'network' | 'server' | 'unknown' {
  const lowerError = error.toLowerCase();

  if (lowerError.includes('private') || lowerError.includes('game details')) {
    return 'private_profile';
  }
  if (lowerError.includes('invalid') || lowerError.includes('not found') || lowerError.includes('steam id')) {
    return 'invalid_id';
  }
  if (lowerError.includes('no games') || lowerError.includes("couldn't find any games")) {
    return 'no_games';
  }
  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return 'network';
  }
  if (lowerError.includes('server') || lowerError.includes('something went wrong')) {
    return 'server';
  }
  return 'unknown';
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  const errorType = getErrorType(error);

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
          <span className="text-red-400 text-sm font-mono ml-4">ERROR.log</span>
        </div>

        {/* Error Body */}
        <div className="p-8">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-lg bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center">
              {errorType === 'private_profile' ? (
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : errorType === 'invalid_id' ? (
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : errorType === 'network' ? (
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
          </div>

          {/* Error Title */}
          <div className="text-center mb-6">
            <h2 className="orbitron text-2xl font-bold text-red-400 mb-2">
              {errorType === 'private_profile' && 'PROFILE IS PRIVATE'}
              {errorType === 'invalid_id' && 'STEAM ID NOT FOUND'}
              {errorType === 'no_games' && 'NO GAMES FOUND'}
              {errorType === 'network' && 'CONNECTION ERROR'}
              {errorType === 'server' && 'SERVER ERROR'}
              {errorType === 'unknown' && 'SOMETHING WENT WRONG'}
            </h2>
            <div className="bg-terminal-dark rounded-lg p-4 border border-red-500/20">
              <p className="text-gray-300 font-mono text-sm">
                {error}
              </p>
            </div>
          </div>

          {/* Contextual Help */}
          {errorType === 'private_profile' && (
            <div className="mb-6 bg-neon-orange/10 border border-neon-orange/30 rounded-lg p-5">
              <h3 className="orbitron text-sm font-bold text-neon-orange mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                HOW TO FIX THIS
              </h3>
              <ol className="space-y-2 font-mono text-sm">
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">1</span>
                  <span>Open Steam and go to your profile</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">2</span>
                  <span>Click &quot;Edit Profile&quot; → &quot;Privacy Settings&quot;</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">3</span>
                  <span>Set <strong className="text-neon-green">&quot;My profile&quot;</strong> to Public</span>
                </li>
                <li className="flex items-start gap-3 text-gray-300">
                  <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">4</span>
                  <span>Set <strong className="text-neon-green">&quot;Game details&quot;</strong> to Public</span>
                </li>
              </ol>
              <a
                href="https://steamcommunity.com/my/edit/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-neon-orange/20 border border-neon-orange text-neon-orange rounded-lg font-mono text-sm hover:bg-neon-orange hover:text-black transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                OPEN STEAM PRIVACY SETTINGS
              </a>
            </div>
          )}

          {errorType === 'invalid_id' && (
            <div className="mb-6 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg p-5">
              <h3 className="orbitron text-sm font-bold text-neon-cyan mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                VALID FORMATS
              </h3>
              <div className="space-y-3 font-mono text-sm">
                <div className="bg-terminal-dark rounded-lg p-3 border border-terminal-border">
                  <p className="text-gray-500 text-xs mb-1">Profile URL:</p>
                  <p className="text-neon-green">steamcommunity.com/id/<span className="text-white">yourname</span></p>
                </div>
                <div className="bg-terminal-dark rounded-lg p-3 border border-terminal-border">
                  <p className="text-gray-500 text-xs mb-1">Steam ID (17 digits):</p>
                  <p className="text-neon-green"><span className="text-white">76561198012345678</span></p>
                </div>
                <div className="bg-terminal-dark rounded-lg p-3 border border-terminal-border">
                  <p className="text-gray-500 text-xs mb-1">Profile URL (numeric):</p>
                  <p className="text-neon-green">steamcommunity.com/profiles/<span className="text-white">76561198012345678</span></p>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                Tip: Go to your Steam profile in a browser and copy the URL from the address bar.
              </p>
            </div>
          )}

          {errorType === 'no_games' && (
            <div className="mb-6 bg-neon-yellow/10 border border-neon-yellow/30 rounded-lg p-5">
              <h3 className="orbitron text-sm font-bold text-neon-yellow mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                POSSIBLE CAUSES
              </h3>
              <ul className="space-y-2 font-mono text-sm">
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-neon-yellow">-</span>
                  <span>Your game library may be hidden in privacy settings</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-neon-yellow">-</span>
                  <span>You may not own any games on this account</span>
                </li>
                <li className="flex items-start gap-2 text-gray-300">
                  <span className="text-neon-yellow">-</span>
                  <span>Games may be in a family share library</span>
                </li>
              </ul>
              <p className="text-gray-500 text-xs mt-3">
                Make sure &quot;Game details&quot; is set to Public in your Steam Privacy Settings.
              </p>
            </div>
          )}

          {errorType === 'network' && (
            <div className="mb-6 bg-terminal-dark border border-terminal-border rounded-lg p-5">
              <h3 className="orbitron text-sm font-bold text-gray-400 mb-3">TROUBLESHOOTING</h3>
              <ul className="space-y-2 font-mono text-sm">
                <li className="flex items-start gap-2 text-gray-400">
                  <span className="text-neon-cyan">[1]</span>
                  <span>Check your internet connection</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <span className="text-neon-cyan">[2]</span>
                  <span>Try refreshing the page</span>
                </li>
                <li className="flex items-start gap-2 text-gray-400">
                  <span className="text-neon-cyan">[3]</span>
                  <span>Disable VPN if you&apos;re using one</span>
                </li>
              </ul>
            </div>
          )}

          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full btn-arcade btn-arcade-cyan rounded-lg py-4 text-lg"
            >
              <span className="flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                TRY AGAIN
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
