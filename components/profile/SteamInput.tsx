'use client';

import { useState } from 'react';

interface SteamInputProps {
  onSubmit: (steamInput: string) => void;
  isLoading?: boolean;
}

export default function SteamInput({ onSubmit, isLoading }: SteamInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHelp(false)}
          />
          <div className="relative terminal-box rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="terminal-header sticky top-0">
              <span className="text-gray-400 text-sm font-mono ml-16">HELP.txt</span>
              <button
                onClick={() => setShowHelp(false)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* What we need */}
              <div>
                <h3 className="orbitron text-lg font-bold text-neon-cyan mb-3">HOW TO FIND YOUR STEAM ID</h3>
                <div className="space-y-4 text-sm font-mono">
                  <div className="bg-terminal-dark rounded-lg p-4 border border-terminal-border">
                    <p className="text-gray-400 mb-2">Option 1: Steam Profile URL</p>
                    <p className="text-neon-green text-xs break-all">
                      steamcommunity.com/id/<span className="text-white">yourname</span>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">Copy the URL from your browser when viewing your profile</p>
                  </div>
                  <div className="bg-terminal-dark rounded-lg p-4 border border-terminal-border">
                    <p className="text-gray-400 mb-2">Option 2: Steam ID Number</p>
                    <p className="text-neon-green text-xs">
                      <span className="text-white">76561198012345678</span>
                    </p>
                    <p className="text-gray-600 text-xs mt-1">17-digit number found in your profile URL or settings</p>
                  </div>
                </div>
              </div>

              {/* Make profile public */}
              <div>
                <h3 className="orbitron text-lg font-bold text-neon-orange mb-3">MAKE YOUR PROFILE PUBLIC</h3>
                <p className="text-gray-400 font-mono text-sm mb-4">
                  We can only read your games if your profile is public. Here&apos;s how to check:
                </p>
                <ol className="space-y-3 text-sm font-mono">
                  <li className="flex items-start gap-3">
                    <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">1</span>
                    <span className="text-gray-300">Open Steam and go to your profile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">2</span>
                    <span className="text-gray-300">Click &quot;Edit Profile&quot; → &quot;Privacy Settings&quot;</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">3</span>
                    <span className="text-gray-300">Set &quot;My profile&quot; to <span className="text-neon-green">Public</span></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-neon-cyan bg-neon-cyan/20 px-2 py-0.5 rounded text-xs">4</span>
                    <span className="text-gray-300">Set &quot;Game details&quot; to <span className="text-neon-green">Public</span></span>
                  </li>
                </ol>
                <a
                  href="https://steamcommunity.com/my/edit/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-terminal-dark border border-neon-cyan text-neon-cyan rounded-lg font-mono text-sm hover:bg-neon-cyan hover:text-black transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  OPEN STEAM PRIVACY SETTINGS
                </a>
              </div>

              {/* What we access */}
              <div className="bg-neon-green/10 border border-neon-green/30 rounded-lg p-4">
                <h4 className="orbitron text-sm font-bold text-neon-green mb-2">PRIVACY GUARANTEE</h4>
                <ul className="text-sm font-mono space-y-2">
                  <li className="flex items-center gap-2 text-gray-300">
                    <span className="text-neon-green">+</span>
                    We only read your game library and playtime
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <span className="text-red-400">-</span>
                    We NEVER access passwords or payment info
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <span className="text-red-400">-</span>
                    We NEVER see your friends list or messages
                  </li>
                  <li className="flex items-center gap-2 text-gray-300">
                    <span className="text-neon-green">+</span>
                    You can unlink your account anytime
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowHelp(false)}
                className="w-full py-3 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan rounded-lg font-mono text-sm hover:bg-neon-cyan hover:text-black transition-all"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Window */}
      <div className="terminal-box rounded-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">STEAM_LINK.exe</span>
          <button
            onClick={() => setShowHelp(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-neon-cyan transition-colors flex items-center gap-1 text-xs font-mono"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            HELP
          </button>
        </div>

        {/* Terminal Body */}
        <div className="p-8">
          {/* Prompt Display */}
          <div className="mb-6">
            <p className="font-mono text-sm text-gray-500 mb-2">
              <span className="text-neon-green">root@steam-rec</span>
              <span className="text-gray-600">:</span>
              <span className="text-neon-blue">~</span>
              <span className="text-gray-600">$</span>
              <span className="text-gray-400 ml-2">./analyze_profile.sh</span>
            </p>
            <p className="text-gray-400 font-mono text-sm">
              &gt; Paste your Steam profile URL or Steam ID below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Field */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-neon-green">
                &gt;
              </div>
              <input
                id="steam-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="steamcommunity.com/id/yourname"
                disabled={isLoading}
                className={`
                  w-full pl-10 pr-6 py-4
                  bg-terminal-dark
                  border-2 ${isFocused ? 'border-neon-cyan box-glow-cyan' : 'border-terminal-border'}
                  rounded-lg
                  text-neon-cyan font-mono text-base
                  placeholder:text-gray-600
                  focus:outline-none
                  transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label="Enter your Steam profile URL or Steam ID"
              />
              {isFocused && !input && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-5 bg-neon-cyan animate-pulse" />
              )}
            </div>

            {/* Example formats */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="text-gray-600">Examples:</span>
              <button
                type="button"
                onClick={() => setInput('steamcommunity.com/id/yourname')}
                className="text-gray-500 hover:text-neon-cyan transition-colors"
              >
                /id/yourname
              </button>
              <span className="text-gray-700">|</span>
              <button
                type="button"
                onClick={() => setInput('76561198012345678')}
                className="text-gray-500 hover:text-neon-cyan transition-colors"
              >
                76561198012345678
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-full btn-arcade btn-arcade-green rounded-lg py-4 text-lg disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="relative w-5 h-5">
                    <div className="absolute inset-0 border-2 border-neon-green/20 rounded-full" />
                    <div className="absolute inset-0 border-2 border-transparent border-t-neon-green rounded-full animate-spin" />
                  </div>
                  ANALYZING...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  LINK STEAM ACCOUNT
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 terminal-box rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="orbitron text-sm font-bold text-neon-green mb-2 uppercase tracking-wider">
              SAFE & SECURE
            </h3>
            <p className="text-sm text-gray-400 font-mono mb-3">
              We only access your <span className="text-white">public</span> game library and playtime. No passwords, no payment info, no private data.
            </p>
            <button
              onClick={() => setShowHelp(true)}
              className="text-neon-cyan font-mono text-xs hover:underline flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Need help finding your Steam ID?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
