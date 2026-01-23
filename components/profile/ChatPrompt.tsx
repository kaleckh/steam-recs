'use client';

import { useState } from 'react';

interface ChatPromptProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
}

export default function ChatPrompt({ onSubmit, isLoading }: ChatPromptProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSubmit(query.trim());
      setQuery('');
      setIsExpanded(false);
    }
  };

  const exampleQueries = [
    "Games like Elden Ring but easier",
    "Co-op games for 2-4 players",
    "Relaxing indie games",
    "Story-driven RPGs under $20",
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Collapsed State */}
        {!isExpanded && (
          <div className="flex items-center gap-3">
            <div className="flex-grow">
              <form onSubmit={handleSubmit} className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsExpanded(true)}
                  placeholder="Ask for game recommendations..."
                  disabled={isLoading}
                  className="w-full px-5 py-3 text-base border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all bg-gray-50 hover:bg-white"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2 px-5 rounded-lg disabled:cursor-not-allowed transition-all text-sm shadow-sm"
                >
                  {isLoading ? (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Search</span>
                      <svg className="w-4 h-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ask for Recommendations</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Describe what you're looking for
                </p>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'Games like Hollow Knight'"
                disabled={isLoading}
                autoFocus
                className="w-full px-5 py-3 text-base border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed transition-all bg-white"
              />
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2 px-5 rounded-lg disabled:cursor-not-allowed transition-all text-sm shadow-sm"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Search'
                )}
              </button>
            </form>

            {/* Example Queries */}
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(example);
                      setIsExpanded(false);
                    }}
                    disabled={isLoading}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
