'use client';

import { useState } from 'react';

interface AIAssistantBoxProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export default function AIAssistantBox({ onSubmit, isLoading }: AIAssistantBoxProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  const examplePrompts = [
    "Find me a relaxing game like Stardew Valley",
    "What's a good roguelike with great music?",
    "Suggest a co-op game for 4 players",
  ];

  const handleExampleClick = (prompt: string) => {
    setQuery(prompt);
  };

  return (
    <div className="flex justify-center">
      <div className="terminal-box rounded-lg w-full max-w-6xl overflow-hidden">
        {/* Terminal Header */}
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">AI_ASSISTANT.exe</span>
        </div>

        <div className="p-8">
          {/* Title with AI badge */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan flex items-center justify-center">
                <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="orbitron text-xl font-bold text-white flex items-center gap-2">
                  ASK THE AI
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                    POWERED BY AI
                  </span>
                </h2>
                <p className="text-xs text-gray-500 font-mono">
                  Describe what you're looking for in natural language
                </p>
              </div>
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="mb-6">
            <div
              className={`
                relative bg-terminal-dark rounded-lg overflow-hidden
                border-2 transition-all duration-300
                ${isFocused ? 'border-neon-cyan box-glow-cyan' : 'border-terminal-border'}
              `}
            >
              <div className="flex items-center">
                {/* Terminal prompt */}
                <span className="text-neon-green font-mono text-lg pl-4 flex-shrink-0">&gt;</span>

                {/* Input */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Find me a cozy game like Stardew Valley but with combat..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-base text-neon-cyan placeholder-gray-600 focus:outline-none disabled:cursor-not-allowed font-mono py-4 px-3"
                />

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className={`
                    flex-shrink-0 h-full px-6 py-4 font-mono text-sm font-bold
                    transition-all duration-200 uppercase tracking-wider
                    border-l-2
                    ${query.trim() && !isLoading
                      ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20'
                      : 'bg-terminal-dark border-terminal-border text-gray-600 cursor-not-allowed'
                    }
                  `}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-neon-cyan/20 border-t-neon-cyan rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      SEARCH
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Example Prompts */}
          <div className="space-y-3">
            <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
              <span className="text-neon-orange">//</span> TRY ASKING:
            </p>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(prompt)}
                  className="px-3 py-2 text-xs font-mono text-gray-400 bg-terminal-dark border border-terminal-border rounded-lg hover:border-neon-cyan hover:text-neon-cyan transition-all duration-200 text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Feature Callout */}
          <div className="mt-6 pt-6 border-t border-terminal-border">
            <div className="flex items-center gap-6 text-xs text-gray-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neon-green rounded-full animate-pulse" />
                <span>Understands context</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                <span>Knows your library</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-neon-orange rounded-full animate-pulse" />
                <span>Semantic search</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
