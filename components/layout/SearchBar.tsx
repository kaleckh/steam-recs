'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SearchBarProps {
  /** Size variant - 'hero' for landing page, 'header' for nav bar */
  variant?: 'hero' | 'header';
  /** Initial query value */
  initialQuery?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Callback when search is submitted (optional - defaults to navigation) */
  onSearch?: (query: string) => void;
  /** Show example prompts below (only for hero variant) */
  showExamples?: boolean;
  /** User ID for personalized search */
  userId?: string;
}

const EXAMPLE_PROMPTS = [
  'cozy roguelike with good progression',
  'games like Vampire Survivors but harder',
  'relaxing puzzle games for short sessions',
  'story-rich RPG with meaningful choices',
];

export default function SearchBar({
  variant = 'header',
  initialQuery = '',
  placeholder = 'Find your next favorite game...',
  autoFocus = false,
  onSearch,
  showExamples = false,
  userId,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (onSearch) {
      onSearch(query.trim());
    } else {
      // Default: navigate to search page
      const params = new URLSearchParams({ q: query.trim() });
      if (userId) params.set('userId', userId);
      router.push(`/search?${params.toString()}`);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    if (onSearch) {
      onSearch(example);
    } else {
      const params = new URLSearchParams({ q: example });
      if (userId) params.set('userId', userId);
      router.push(`/search?${params.toString()}`);
    }
  };

  // Hero variant - large, prominent search
  if (variant === 'hero') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className={`
            relative flex items-center
            bg-terminal-dark border-2 rounded-lg
            transition-all duration-200
            ${isFocused ? 'border-neon-cyan shadow-[0_0_20px_rgba(0,255,245,0.2)]' : 'border-terminal-border'}
          `}>
            {/* Terminal prompt */}
            <span className="pl-4 text-neon-green font-mono text-lg">&gt;</span>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              className="flex-1 bg-transparent py-4 px-3 text-lg text-neon-cyan placeholder-gray-600 font-mono focus:outline-none"
            />

            {/* Search button */}
            <button
              type="submit"
              disabled={!query.trim()}
              className="m-2 px-6 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-sm rounded hover:bg-neon-cyan hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SEARCH
            </button>
          </div>
        </form>

        {/* Example prompts */}
        {showExamples && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-gray-600 font-mono">Try:</span>
            {EXAMPLE_PROMPTS.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(prompt)}
                className="text-gray-500 hover:text-neon-cyan font-mono transition-colors"
              >
                "{prompt}"{i < 2 && <span className="text-gray-700 ml-2">•</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Header variant - compact search for navigation
  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className={`
        flex items-center
        bg-terminal-dark border rounded-lg
        transition-all duration-200
        ${isFocused ? 'border-neon-cyan' : 'border-terminal-border'}
      `}>
        {/* Search icon */}
        <svg
          className="w-4 h-4 ml-3 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-48 lg:w-64 bg-transparent py-2 px-2 text-sm text-neon-cyan placeholder-gray-600 font-mono focus:outline-none"
        />

        {/* Submit on enter - hidden button */}
        <button type="submit" className="sr-only">Search</button>
      </div>
    </form>
  );
}
