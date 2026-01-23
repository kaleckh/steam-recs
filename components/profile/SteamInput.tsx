'use client';

import { useState } from 'react';

interface SteamInputProps {
  onSubmit: (steamInput: string) => void;
  isLoading?: boolean;
}

export default function SteamInput({ onSubmit, isLoading }: SteamInputProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      {/* Terminal Window */}
      <div className="terminal-box rounded-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">STEAM_LINK.exe</span>
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
              &gt; Enter your Steam profile identifier to begin analysis...
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
                placeholder="76561198012345678 or steamcommunity.com/id/yourname"
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
                aria-label="Enter your Steam ID to get recommendations"
              />
              {isFocused && !input && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-5 bg-neon-cyan animate-pulse" />
              )}
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
                  INITIALIZE SCAN
                </span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Info Panel */}
      <div className="mt-6 terminal-box rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-neon-yellow/10 border border-neon-yellow/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-neon-yellow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="orbitron text-sm font-bold text-neon-yellow mb-2 uppercase tracking-wider">
              PROFILE REQUIREMENTS
            </h3>
            <ul className="text-sm text-gray-400 font-mono space-y-1">
              <li className="flex items-center gap-2">
                <span className="text-neon-green">[OK]</span>
                <span>Steam profile must be set to PUBLIC</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neon-green">[OK]</span>
                <span>Game details visibility enabled</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-neon-cyan">[i]</span>
                <span>Only reads game library + playtime</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
