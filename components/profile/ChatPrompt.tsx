'use client';

import { useState } from 'react';

interface ChatPromptProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export default function ChatPrompt({ onSubmit, isLoading }: ChatPromptProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
      <div
        className={`
          terminal-box rounded-full px-6 py-3
          border ${isFocused ? 'border-neon-cyan box-glow-cyan' : 'border-terminal-border'}
          transition-all duration-300
          animate-slide-up
        `}
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          {/* Prompt indicator */}
          <span className="text-neon-green font-mono text-sm flex-shrink-0">&gt;</span>

          {/* Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Find me a cozy game like Stardew Valley..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-base text-neon-cyan placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed font-mono"
          />

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className={`
              flex-shrink-0 w-10 h-10 rounded-full
              flex items-center justify-center
              border-2 transition-all duration-200
              ${query.trim() && !isLoading
                ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20 hover:scale-105'
                : 'bg-terminal-dark border-terminal-border text-gray-600 cursor-not-allowed'
              }
            `}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            )}
          </button>
        </form>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="text-center mt-2">
        <span className="text-[10px] text-gray-600 font-mono">
          ASK FOR RECOMMENDATIONS IN <span className="text-neon-cyan">NATURAL LANGUAGE</span>
        </span>
      </div>
    </div>
  );
}
