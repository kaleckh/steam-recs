'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

interface SearchFilters {
  minReviewScore: number;
  popularityScore: number;
  isFree?: boolean;
}

const LOADING_WORDS = ['SEARCHING', 'CHECKING', 'LOOTING', 'BROWSING', 'SCANNING', 'ANALYZING'];

interface SearchResult {
  appId: string;
  name: string;
  similarity?: number;
  distance?: number;
  releaseYear: number | null;
  reviewScore: number | null;
  reviewCount: number | null;
  isFree: boolean | null;
  headerImage: string | null;
  genres: string[];
  tags?: string[];
  shortDescription: string | null;
  price: string | null;
  aiReason?: string | null;
}

interface ConversationContext {
  originalQuery: string;
  refinements: string[];
  round: number;
}

interface FollowUpQuestion {
  question: string;
  suggestedAnswers: string[];
}

interface ConversationData {
  round: number;
  maxRounds: number;
  canRefine: boolean;
  followUpQuestions: FollowUpQuestion[];
  context: ConversationContext;
}

interface CollectedAnswer {
  question: string;
  answer: string;
}

interface SearchResponse {
  success: boolean;
  type: string;
  query: string;
  count: number;
  games: SearchResult[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  conversation?: ConversationData;
}

interface AISearchTabProps {
  userId?: string;
  isPremium?: boolean;
}

export default function AISearchTab({ userId, isPremium = false }: AISearchTabProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [followUpInput, setFollowUpInput] = useState('');

  // If not premium, show upgrade prompt instead of search
  if (!isPremium) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="terminal-box rounded-lg overflow-hidden">
          <div className="terminal-header">
            <span className="text-gray-400 text-sm font-mono ml-16">AI_SEARCH.exe</span>
          </div>
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 border-2 border-neon-orange mb-6">
              <svg className="w-10 h-10 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="orbitron text-2xl font-bold text-white mb-3">
              AI SEARCH IS A PRO FEATURE
            </h2>
            <p className="text-gray-400 font-mono text-sm mb-6 max-w-md mx-auto">
              Unlock natural language game search powered by AI. Describe exactly what you&apos;re looking for and find your perfect match.
            </p>
            <Link
              href="/profile?tab=analytics"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-black transition-all rounded-lg font-mono text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              UPGRADE TO PRO
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);

  // Multi-question refinement state
  const [collectedAnswers, setCollectedAnswers] = useState<CollectedAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    minReviewScore: 0,
    popularityScore: 50,
    isFree: undefined,
  });

  // Filter results
  const filteredResults = useMemo(() => {
    let filtered = results.filter(game => {
      if (filters.minReviewScore > 0 && game.reviewScore !== null) {
        if (game.reviewScore < filters.minReviewScore) return false;
      }
      if (filters.isFree === true && game.isFree !== true) return false;
      return true;
    });

    if (filters.popularityScore !== 50 && filtered.length > 0) {
      const gamesWithReviews = filtered.filter(g => g.reviewCount !== null && g.reviewCount > 0);
      const gamesWithoutReviews = filtered.filter(g => g.reviewCount === null || g.reviewCount === 0);

      if (gamesWithReviews.length > 0) {
        const sortedByReviews = [...gamesWithReviews].sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0));
        const medianIdx = Math.floor(sortedByReviews.length / 2);
        const medianReviewCount = sortedByReviews[medianIdx]?.reviewCount || 1000;

        if (filters.popularityScore < 50) {
          const threshold = medianReviewCount * (1 + (50 - filters.popularityScore) / 50);
          const hiddenGems = gamesWithReviews
            .filter(g => (g.reviewCount || 0) < threshold)
            .sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0));
          filtered = [...gamesWithoutReviews, ...hiddenGems];
        } else {
          const threshold = medianReviewCount * ((filters.popularityScore - 50) / 50);
          const popular = gamesWithReviews
            .filter(g => (g.reviewCount || 0) >= threshold)
            .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
          filtered = popular;
        }
      }
    }

    return filtered;
  }, [results, filters]);

  // Cycle through loading words
  useEffect(() => {
    if (!isLoading) return;
    const interval = setInterval(() => {
      setLoadingWordIndex((prev) => (prev + 1) % LOADING_WORDS.length);
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setError(null);
    setCollectedAnswers([]);
    setCurrentQuestionIndex(0);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: 'ai',
        limit: '15',
      });
      if (userId) params.set('userId', userId);

      const response = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.games);
        setConversation(data.conversation || null);
      } else {
        setError(data.error || 'Search failed');
        setConversation(null);
      }
    } catch {
      setError('Failed to perform search');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setConversation(null);
      performSearch(query.trim());
    }
  };

  const handleFollowUpClick = async (answer: string) => {
    if (!conversation?.context) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        type: 'ai',
        limit: '15',
        context: JSON.stringify(conversation.context),
        round: String(conversation.round + 1),
        refinement: answer,
      });
      if (userId) params.set('userId', userId);

      const response = await fetch(`/api/search?${params.toString()}`);
      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.games);
        setConversation(data.conversation || null);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Failed to refine search');
    } finally {
      setIsLoading(false);
    }
  };

  const examplePrompts = [
    'A cozy game like Stardew Valley but with combat',
    'Challenging roguelike with great music',
    'Relaxing puzzle games for short sessions',
    'Story-rich RPG with meaningful choices',
  ];

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="terminal-box rounded-lg overflow-hidden">
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">AI_SEARCH.exe</span>
        </div>

        <div className="p-6">
          {/* Title */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 border border-neon-cyan flex items-center justify-center">
              <svg className="w-5 h-5 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h2 className="orbitron text-lg font-bold text-white flex items-center gap-2">
                NATURAL LANGUAGE SEARCH
                <span className="px-2 py-0.5 text-[10px] font-mono bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                  AI POWERED
                </span>
              </h2>
              <p className="text-xs text-gray-500 font-mono">
                Describe what you're looking for in plain English
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green font-mono">&gt;</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find me a relaxing game like Stardew Valley..."
                  className="w-full bg-terminal-dark border-2 border-terminal-border rounded-lg py-3 pl-10 pr-4 text-neon-cyan placeholder-gray-600 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={!query.trim() || isLoading}
                className="btn-arcade rounded-lg px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                SEARCH
              </button>
            </div>
          </form>

          {/* Discovery Mode Slider */}
          <div className="mb-4 p-4 bg-terminal-dark/50 border border-terminal-border rounded-lg">
            <label className="block text-sm font-mono text-gray-400 mb-3">
              <span className="text-neon-green">&gt;</span> Discovery Mode:{' '}
              <span className={
                filters.popularityScore === 50
                  ? 'text-gray-400'
                  : filters.popularityScore < 50
                    ? 'text-neon-orange'
                    : 'text-neon-green'
              }>
                {filters.popularityScore === 50
                  ? 'Balanced'
                  : filters.popularityScore < 50
                    ? 'Hidden Gems'
                    : 'Popular Titles'}
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={filters.popularityScore}
              onChange={(e) => setFilters(prev => ({ ...prev, popularityScore: parseInt(e.target.value) }))}
              className="slider-retro w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1 font-mono">
              <span className="text-neon-orange">Hidden Gems</span>
              <span>Balanced</span>
              <span className="text-neon-green">Popular</span>
            </div>
          </div>

          {/* Example Prompts */}
          {!hasSearched && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">
                <span className="text-neon-orange">//</span> TRY ASKING:
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setQuery(prompt);
                      performSearch(prompt);
                    }}
                    className="px-3 py-2 text-xs font-mono text-gray-400 bg-terminal-dark border border-terminal-border rounded-lg hover:border-neon-cyan hover:text-neon-cyan transition-all text-left"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="terminal-box rounded-lg p-8 text-center max-w-md">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div
                className="w-full h-full rounded-full animate-spin"
                style={{
                  border: '4px solid #3a3a4a',
                  borderTopColor: 'var(--neon-cyan)',
                  borderRightColor: 'var(--neon-orange)',
                }}
              />
            </div>
            <p className="text-neon-cyan font-mono mb-2">
              {LOADING_WORDS[loadingWordIndex]}
              <span className="inline-block w-6 text-left animate-pulse">...</span>
            </p>
            <p className="text-gray-500 font-mono text-sm mb-4">"{query}"</p>
            <div className="px-4 py-2 bg-neon-orange/10 border border-neon-orange/30 rounded-lg">
              <p className="text-neon-orange font-mono text-xs">
                <span className="text-white font-bold">150,000+</span> games in database
              </p>
              <p className="text-gray-500 font-mono text-[10px] mt-1">
                AI is finding the perfect matches for you
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="terminal-box rounded-lg p-6 text-center">
          <p className="text-red-500 font-mono mb-2">[ERROR] {error}</p>
          <button
            onClick={() => performSearch(query)}
            className="text-neon-cyan font-mono text-sm hover:underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && hasSearched && results.length > 0 && (
        <>
          {/* Results Header */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="px-2 py-1 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan text-xs font-mono rounded">
                AI POWERED
              </span>
              <span className="text-gray-500 font-mono text-sm">
                {filteredResults.length} results for "{query}"
              </span>
            </div>
          </div>

          {/* Compact Filters */}
          <div className="flex flex-wrap items-center gap-4 p-3 bg-terminal-dark/50 border border-terminal-border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">
                {filters.popularityScore === 50 ? 'Balanced' : filters.popularityScore < 50 ? 'Hidden Gems' : 'Popular'}
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.popularityScore}
                onChange={(e) => setFilters(prev => ({ ...prev, popularityScore: parseInt(e.target.value) }))}
                className="w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">Min {filters.minReviewScore}%</span>
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                value={filters.minReviewScore}
                onChange={(e) => setFilters(prev => ({ ...prev, minReviewScore: parseInt(e.target.value) }))}
                className="w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
              />
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isFree === true}
                onChange={(e) => setFilters(prev => ({ ...prev, isFree: e.target.checked ? true : undefined }))}
                className="w-3.5 h-3.5 rounded border-terminal-border bg-terminal-dark accent-neon-green"
              />
              <span className="text-xs font-mono text-gray-500">Free only</span>
            </label>
          </div>

          {/* Follow-up Questions */}
          {conversation?.canRefine && conversation.followUpQuestions && conversation.followUpQuestions.length > 0 && (
            <div className="terminal-box rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neon-orange font-mono text-xs uppercase tracking-wider">
                  Refine your search
                </span>
                <span className="px-2 py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-xs font-mono rounded">
                  More answers = better results
                </span>
              </div>

              <div className="space-y-4">
                {conversation.followUpQuestions.map((q, qIndex) => {
                  const isAnswered = qIndex < collectedAnswers.length;
                  const isCurrent = qIndex === currentQuestionIndex;
                  const isUpcoming = qIndex > currentQuestionIndex;

                  return (
                    <div key={qIndex} className={`transition-all ${isUpcoming ? 'opacity-40' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        {isAnswered ? (
                          <span className="text-neon-green">✓</span>
                        ) : (
                          <span className="text-gray-600">{qIndex + 1}.</span>
                        )}
                        <p className={`font-mono text-sm ${isAnswered ? 'text-gray-500' : 'text-neon-cyan'}`}>
                          {q.question}
                        </p>
                        {isAnswered && (
                          <span className="text-neon-green font-mono text-sm ml-2">
                            → {collectedAnswers[qIndex].answer}
                          </span>
                        )}
                      </div>

                      {isCurrent && !isAnswered && (
                        <div className="flex flex-wrap gap-2 ml-5">
                          {q.suggestedAnswers.map((answer, aIndex) => (
                            <button
                              key={aIndex}
                              onClick={() => {
                                setCollectedAnswers(prev => [...prev, { question: q.question, answer }]);
                                if (currentQuestionIndex < conversation.followUpQuestions.length - 1) {
                                  setCurrentQuestionIndex(prev => prev + 1);
                                }
                                setFollowUpInput('');
                              }}
                              disabled={isLoading}
                              className="px-3 py-1.5 bg-terminal-dark border border-neon-cyan/50 rounded text-neon-cyan font-mono text-sm transition-all hover:bg-neon-cyan/20 hover:border-neon-cyan disabled:opacity-50"
                            >
                              {answer}
                            </button>
                          ))}
                          <input
                            type="text"
                            value={followUpInput}
                            onChange={(e) => setFollowUpInput(e.target.value)}
                            placeholder="Other..."
                            className="px-3 py-1.5 bg-terminal-dark border border-terminal-border rounded text-neon-cyan placeholder-gray-600 font-mono text-sm focus:outline-none focus:border-neon-cyan transition-colors w-24"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && followUpInput.trim()) {
                                setCollectedAnswers(prev => [...prev, { question: q.question, answer: followUpInput.trim() }]);
                                if (currentQuestionIndex < conversation.followUpQuestions.length - 1) {
                                  setCurrentQuestionIndex(prev => prev + 1);
                                }
                                setFollowUpInput('');
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-terminal-border flex items-center justify-between">
                <span className="text-gray-500 font-mono text-xs">
                  {collectedAnswers.length} of {conversation.followUpQuestions.length} answered
                </span>
                <button
                  onClick={() => {
                    if (collectedAnswers.length > 0) {
                      const allAnswers = collectedAnswers.map(a => a.answer).join(', ');
                      handleFollowUpClick(allAnswers);
                      setCollectedAnswers([]);
                      setCurrentQuestionIndex(0);
                    }
                  }}
                  disabled={collectedAnswers.length === 0 || isLoading}
                  className="px-4 py-2 bg-neon-orange/20 border border-neon-orange text-neon-orange font-mono text-sm rounded hover:bg-neon-orange/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {collectedAnswers.length === conversation.followUpQuestions.length
                    ? 'SEARCH WITH ALL ANSWERS'
                    : `SEARCH NOW (${collectedAnswers.length})`}
                </button>
              </div>
            </div>
          )}

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResults.map((game, index) => (
              <Link
                key={game.appId}
                href={`/game/${game.appId}`}
                className="card-arcade rounded-lg overflow-hidden group opacity-0 animate-scale-in"
                style={{
                  animationDelay: `${index * 0.05}s`,
                  animationFillMode: 'forwards',
                }}
              >
                <div className="relative aspect-video overflow-hidden bg-terminal-dark">
                  {game.headerImage ? (
                    <img
                      src={game.headerImage}
                      alt={game.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-gray-600 font-mono text-sm">NO IMAGE</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-terminal-dark to-transparent opacity-60" />
                </div>

                <div className="p-4">
                  <h3 className="text-white font-bold mb-2 line-clamp-1 group-hover:text-neon-cyan transition-colors orbitron text-sm">
                    {game.name}
                  </h3>

                  {game.aiReason && (
                    <div className="mb-2 p-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded">
                      <p className="text-neon-cyan font-mono text-xs line-clamp-2">
                        <span className="text-neon-orange">[AI]</span> {game.aiReason}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-xs font-mono">
                    {game.reviewScore !== null && (
                      <span className={`${game.reviewScore >= 80 ? 'text-neon-green' : game.reviewScore >= 60 ? 'text-neon-yellow' : 'text-gray-500'}`}>
                        {game.reviewScore}%
                      </span>
                    )}
                    {game.isFree ? (
                      <span className="text-neon-green font-bold">FREE</span>
                    ) : game.price ? (
                      <span className="text-white">{game.price}</span>
                    ) : null}
                  </div>
                </div>

                <div className="h-0.5 bg-terminal-border overflow-hidden">
                  <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-neon-cyan via-neon-orange to-neon-green transition-all duration-500" />
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* No Results */}
      {!isLoading && !error && hasSearched && results.length === 0 && (
        <div className="terminal-box rounded-lg p-8 text-center">
          <p className="text-neon-yellow font-mono mb-2">[WARN] No games found</p>
          <p className="text-gray-500 font-mono text-sm">Try a different search query</p>
        </div>
      )}
    </div>
  );
}
