'use client';

import { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useAuth } from '@/contexts/AuthContext';

interface SearchFilters {
  minReviewScore: number;
  popularityScore: number;
  isFree?: boolean;
}

const LOADING_WORDS = ['SEARCHING', 'CHECKING', 'LOOTING', 'BROWSING', 'SCANNING', 'ANALYZING'];
const ANONYMOUS_SEARCH_KEY = 'anonymous_searches_used';
const ANONYMOUS_SEARCH_LIMIT = 1;

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

interface SearchCredits {
  purchasedCredits: number;
  freeSearchesUsed: number;
  freeSearchesRemaining: number;
  totalRemaining: number;
  freeLimit: number;
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
  searchCredits?: SearchCredits | null;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const query = searchParams.get('q') || '';
  const userId = profile?.id;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [followUpInput, setFollowUpInput] = useState('');
  const [loadingWordIndex, setLoadingWordIndex] = useState(0);
  const [hasRestoredState, setHasRestoredState] = useState(false);

  // Multi-question refinement state
  const [collectedAnswers, setCollectedAnswers] = useState<CollectedAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Credit tracking
  const [searchCredits, setSearchCredits] = useState<SearchCredits | null>(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  // Anonymous user tracking
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [anonymousSearchesUsed, setAnonymousSearchesUsed] = useState(0);

  // Restore state from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('search_last_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.results?.length > 0) {
          setResults(parsed.results);
          setConversation(parsed.conversation || null);
          if (!query && parsed.query) {
            setSearchInput(parsed.query);
          }
        }
      }
      // Load anonymous search count
      const anonSearches = parseInt(localStorage.getItem(ANONYMOUS_SEARCH_KEY) || '0', 10);
      setAnonymousSearchesUsed(anonSearches);
    } catch {}
    setHasRestoredState(true);
  }, [query]);

  // Fetch credit status on mount
  useEffect(() => {
    if (!userId) {
      setCreditsLoading(false);
      return;
    }

    setCreditsLoading(true);
    fetch(`/api/user/credits?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setSearchCredits(data);
        }
      })
      .catch(console.error)
      .finally(() => setCreditsLoading(false));
  }, [userId]);

  // Save state to localStorage for tab persistence
  useEffect(() => {
    if (results.length > 0 && (query || searchInput)) {
      try {
        localStorage.setItem('search_last_state', JSON.stringify({
          results,
          conversation,
          query: query || searchInput,
          timestamp: Date.now(),
        }));
      } catch {}
    }
  }, [results, conversation, query, searchInput]);

  // Filter state
  const [filters, setFilters] = useState<SearchFilters>({
    minReviewScore: 0,
    popularityScore: 50,
    isFree: undefined,
  });

  // Abort controller for cancelling searches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Filter and sort results based on current filters
  const filteredResults = useMemo(() => {
    // First, filter the results
    let filtered = results.filter(game => {
      // Min review score filter
      if (filters.minReviewScore > 0 && game.reviewScore !== null) {
        if (game.reviewScore < filters.minReviewScore) return false;
      }
      // Free to play filter
      if (filters.isFree === true && game.isFree !== true) return false;
      return true;
    });

    // Apply popularity filter/sort based on review count
    // popularityScore: 0 = hidden gems, 50 = balanced, 100 = popular
    if (filters.popularityScore !== 50 && filtered.length > 0) {
      // Get games with review counts for sorting
      const gamesWithReviews = filtered.filter(g => g.reviewCount !== null && g.reviewCount > 0);
      const gamesWithoutReviews = filtered.filter(g => g.reviewCount === null || g.reviewCount === 0);

      if (gamesWithReviews.length > 0) {
        // Calculate median review count as threshold
        const sortedByReviews = [...gamesWithReviews].sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0));
        const medianIdx = Math.floor(sortedByReviews.length / 2);
        const medianReviewCount = sortedByReviews[medianIdx]?.reviewCount || 1000;

        if (filters.popularityScore < 50) {
          // Hidden gems: prefer games with fewer reviews
          // Filter to games below median, sort ascending (fewest reviews first)
          const threshold = medianReviewCount * (1 + (50 - filters.popularityScore) / 50);
          const hiddenGems = gamesWithReviews
            .filter(g => (g.reviewCount || 0) < threshold)
            .sort((a, b) => (a.reviewCount || 0) - (b.reviewCount || 0));
          // Include games without reviews as ultimate hidden gems
          filtered = [...gamesWithoutReviews, ...hiddenGems];
        } else {
          // Popular: prefer games with more reviews
          // Filter to games above threshold, sort descending (most reviews first)
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

  // Helper to get cache key for a query
  const getCacheKey = (q: string) => `search_cache_${q.toLowerCase().trim()}`;

  useEffect(() => {
    async function performSearch() {
      // Wait for localStorage restore to complete first
      if (!hasRestoredState) {
        return;
      }

      // If no query in URL, just use whatever state we have (from localStorage)
      if (!query) {
        setIsLoading(false);
        return;
      }

      // Check if anonymous user has used their trial
      if (!userId) {
        const anonSearches = parseInt(localStorage.getItem(ANONYMOUS_SEARCH_KEY) || '0', 10);
        if (anonSearches >= ANONYMOUS_SEARCH_LIMIT) {
          setShowLoginModal(true);
          setIsLoading(false);
          return;
        }
      }

      const cacheKey = getCacheKey(query);

      // Check localStorage for cached results for THIS query
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const cachedData = JSON.parse(cached);
          // Check if cache is less than 1 hour old
          if (cachedData.timestamp && Date.now() - cachedData.timestamp < 60 * 60 * 1000) {
            setResults(cachedData.games || []);
            setConversation(cachedData.conversation || null);
            setSearchInput(query);
            setIsLoading(false);
            return;
          }
        }
      } catch {
        // Cache read failed, continue with fetch
      }

      // Cancel any existing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this search
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);
      setCollectedAnswers([]); // Reset for new search
      setCurrentQuestionIndex(0);

      try {
        const params = new URLSearchParams({
          q: query,
          type: 'ai',
          limit: '15',
        });
        if (userId) params.set('userId', userId);

        const response = await fetch(`/api/search?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });
        const data: SearchResponse = await response.json();

        if (data.success) {
          setResults(data.games);
          setConversation(data.conversation || null);
          if (data.searchCredits) {
            setSearchCredits(data.searchCredits);
          }

          // Track anonymous search usage
          if (!userId) {
            const newCount = anonymousSearchesUsed + 1;
            setAnonymousSearchesUsed(newCount);
            try {
              localStorage.setItem(ANONYMOUS_SEARCH_KEY, String(newCount));
            } catch {}
          }

          // Save to localStorage
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              games: data.games,
              conversation: data.conversation,
              timestamp: Date.now(),
            }));
          } catch {
            // Cache write failed, continue silently
          }
        } else {
          setError(data.error || 'Search failed');
          setConversation(null);
        }
      } catch (err) {
        // Don't show error if request was cancelled
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        setError('Failed to perform search');
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();

    // Cleanup: abort on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, userId, hasRestoredState]);

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      // Check if anonymous user has used their trial
      if (!userId && anonymousSearchesUsed >= ANONYMOUS_SEARCH_LIMIT) {
        setShowLoginModal(true);
        return;
      }
      setConversation(null); // Reset conversation for new search
      setCollectedAnswers([]); // Reset collected answers
      setCurrentQuestionIndex(0); // Reset question index
      const params = new URLSearchParams({ q: searchInput.trim() });
      if (userId) params.set('userId', userId);
      router.push(`/search?${params.toString()}`);
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
    } catch (err) {
      setError('Failed to refine search');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatedBackground />

      {/* Login Modal for Anonymous Users */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowLoginModal(false)}
          />
          <div className="relative terminal-box rounded-lg p-6 sm:p-8 max-w-md w-full animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-neon-cyan/20 border-2 border-neon-cyan flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="orbitron text-xl sm:text-2xl font-bold text-white mb-2">
                SIGN IN TO CONTINUE
              </h3>
              <p className="text-gray-400 font-mono text-xs sm:text-sm mb-4">
                You've used your free trial search!
              </p>
              <div className="bg-terminal-dark rounded-lg p-3 sm:p-4 mb-6 border border-terminal-border">
                <p className="text-neon-green font-mono text-xs sm:text-sm mb-2">
                  Create a free account to get:
                </p>
                <ul className="text-left text-gray-400 font-mono text-xs space-y-1.5">
                  <li className="flex items-center gap-2">
                    <span className="text-neon-green">✓</span> 5 free AI searches
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-neon-green">✓</span> Personalized recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-neon-green">✓</span> Train your taste with feedback
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 px-6 bg-neon-cyan text-black font-bold rounded-lg hover:bg-neon-cyan/90 transition-all orbitron text-sm sm:text-base"
                >
                  SIGN IN / SIGN UP
                </Link>
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full py-3 px-6 bg-terminal-dark border border-terminal-border text-gray-400 font-mono text-xs sm:text-sm rounded-lg hover:border-gray-500 hover:text-white transition-all"
                >
                  Maybe later
                </button>
              </div>

              <p className="text-gray-600 font-mono text-[10px] sm:text-xs mt-4">
                Free to sign up • No credit card required
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen relative">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-neon-cyan transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2 font-mono"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              BACK
            </button>
            <span className="text-terminal-border">|</span>
            <span className="text-neon-orange font-mono text-[10px] sm:text-xs tracking-wider">AI_SEARCH.exe</span>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="flex-1 relative">
              <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-neon-green font-mono text-sm">&gt;</span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Describe what you're looking for..."
                className="w-full bg-terminal-dark border-2 border-terminal-border rounded-lg py-2.5 sm:py-3 pl-8 sm:pl-10 pr-3 sm:pr-4 text-sm sm:text-base text-neon-cyan placeholder-gray-600 font-mono focus:outline-none focus:border-neon-cyan transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!searchInput.trim() || isLoading}
              className="btn-arcade rounded-lg px-6 sm:px-8 py-2.5 sm:py-0 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              SEARCH
            </button>
          </form>

          {/* Credit Usage Bar */}
          {userId && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 max-w-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500">
                    {creditsLoading ? (
                      'Loading credits...'
                    ) : searchCredits ? (
                      `Free searches: ${searchCredits.freeSearchesUsed}/${searchCredits.freeLimit}`
                    ) : (
                      'Free searches: 0/5'
                    )}
                  </span>
                  {searchCredits && searchCredits.purchasedCredits > 0 && (
                    <span className="text-[10px] sm:text-xs font-mono text-neon-green">
                      +{searchCredits.purchasedCredits} credits
                    </span>
                  )}
                </div>
                <div className="h-1.5 bg-terminal-dark border border-terminal-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      !searchCredits ? 'bg-neon-cyan' :
                      searchCredits.freeSearchesUsed >= searchCredits.freeLimit
                        ? 'bg-red-500'
                        : searchCredits.freeSearchesUsed >= searchCredits.freeLimit - 2
                          ? 'bg-neon-orange'
                          : 'bg-neon-cyan'
                    }`}
                    style={{
                      width: searchCredits
                        ? `${Math.min(100, (searchCredits.freeSearchesUsed / searchCredits.freeLimit) * 100)}%`
                        : '0%',
                    }}
                  />
                </div>
              </div>
              {searchCredits && searchCredits.totalRemaining <= 2 && searchCredits.purchasedCredits === 0 && (
                <span className="text-[10px] sm:text-xs font-mono text-neon-orange animate-pulse">
                  Running low!
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 relative z-10">
        {isLoading ? (
          <div className="flex justify-center py-12 sm:py-20">
            <div className="terminal-box rounded-lg p-6 sm:p-12 text-center max-w-sm sm:max-w-md">
              <div className="relative w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6">
                <div
                  className="w-full h-full rounded-full animate-spin"
                  style={{
                    border: '4px solid #3a3a4a',
                    borderTopColor: 'var(--neon-cyan)',
                    borderRightColor: 'var(--neon-orange)',
                  }}
                />
              </div>
              <p className="text-neon-cyan font-mono text-sm sm:text-lg mb-2">
                {LOADING_WORDS[loadingWordIndex]}
                <span className="inline-block w-6 text-left animate-pulse">...</span>
              </p>
              <p className="text-gray-500 font-mono text-xs sm:text-sm mb-4 line-clamp-1">"{query}"</p>
              <div className="border-t border-terminal-border pt-3 sm:pt-4 mt-3 sm:mt-4">
                <p className="text-neon-cyan font-mono text-sm sm:text-base leading-relaxed mb-1">
                  Analyzing <span className="text-white font-bold">60,000+</span> games
                </p>
                <p className="text-gray-400 font-mono text-xs sm:text-sm mb-4">
                  <span className="text-neon-orange">Accuracy takes a moment.</span> We're finding the <span className="text-neon-green">perfect</span> matches.
                </p>
                <button
                  onClick={handleCancelSearch}
                  className="px-4 py-2 border border-gray-600 text-gray-400 font-mono text-xs rounded hover:border-neon-orange hover:text-neon-orange transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="terminal-box rounded-lg p-8 text-center max-w-md mx-auto">
            <div className="terminal-header mb-4">
              <span className="text-gray-400 text-sm font-mono ml-16">ERROR.log</span>
            </div>
            <p className="text-red-500 font-mono mb-4">[ERROR] {error}</p>
            <button
              onClick={() => router.back()}
              className="btn-arcade rounded-lg"
            >
              GO BACK
            </button>
          </div>
        ) : results.length === 0 && query ? (
          <div className="terminal-box rounded-lg p-8 text-center max-w-md mx-auto">
            <div className="terminal-header mb-4">
              <span className="text-gray-400 text-sm font-mono ml-16">NO_RESULTS.log</span>
            </div>
            <p className="text-neon-yellow font-mono mb-2">[WARN] No games found</p>
            <p className="text-gray-500 font-mono text-sm mb-4">Try a different search query</p>
            <button
              onClick={() => router.back()}
              className="btn-arcade rounded-lg"
            >
              GO BACK
            </button>
          </div>
        ) : !query ? (
          <div className="space-y-4 sm:space-y-6 max-w-xl mx-auto">
            {/* Train Your Taste Banner */}
            <div className="terminal-box rounded-lg p-4 sm:p-6 border-2 border-neon-orange/50 bg-gradient-to-br from-neon-orange/10 to-transparent">
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neon-orange/20 border border-neon-orange flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="orbitron text-sm sm:text-lg font-bold text-neon-orange mb-1 sm:mb-2">
                    TRAIN YOUR TASTE
                  </h3>
                  <p className="text-gray-400 font-mono text-xs sm:text-sm mb-2 sm:mb-3">
                    Search for games you know and <span className="text-neon-green">rate them</span> to teach the AI what you like.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-xs font-mono">
                    <span className="flex items-center gap-1 sm:gap-1.5 text-neon-green">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      Like = More like this
                    </span>
                    <span className="flex items-center gap-1 sm:gap-1.5 text-red-400">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                      Dislike = Less like this
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Help */}
            <div className="terminal-box rounded-lg p-4 sm:p-8 text-center">
              <div className="terminal-header mb-3 sm:mb-4">
                <span className="text-gray-400 text-xs sm:text-sm font-mono ml-16">HELP.txt</span>
              </div>
              <h2 className="orbitron text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-4">
                <span className="text-neon-cyan">&gt;</span> AI-POWERED SEARCH
              </h2>
              <p className="text-gray-400 font-mono text-xs sm:text-sm mb-4 sm:mb-6">
                Describe what you're looking for in natural language.
              </p>
              <div className="space-y-2 text-left">
                <p className="text-neon-orange font-mono text-[10px] sm:text-xs uppercase tracking-wider mb-2 sm:mb-3">Example queries:</p>
                {[
                  'A cozy game like Stardew Valley but with combat',
                  'Challenging roguelike with great music',
                  'Relaxing puzzle games for short sessions',
                  'Story-rich RPG with meaningful choices',
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchInput(example)}
                    className="block w-full text-left px-3 sm:px-4 py-2 bg-terminal-dark border border-terminal-border rounded text-gray-400 font-mono text-xs sm:text-sm hover:border-neon-cyan hover:text-neon-cyan transition-all"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Results Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan text-[10px] sm:text-xs font-mono rounded">
                    AI POWERED
                  </span>
                  <span className="text-gray-500 font-mono text-xs sm:text-sm">
                    {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
                    {filteredResults.length !== results.length && (
                      <span className="text-gray-600"> (from {results.length})</span>
                    )}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-mono text-gray-500 flex items-center gap-1.5">
                  <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-neon-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="hidden sm:inline">Click games to rate them & improve your taste</span>
                  <span className="sm:hidden">Rate games to improve taste</span>
                </span>
              </div>
              <p className="text-gray-400 font-mono text-xs sm:text-base mb-3 sm:mb-4">
                <span className="text-neon-green">&gt;</span> Results for: <span className="text-neon-cyan">"{query}"</span>
              </p>

              {/* Compact Filters */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4 p-3 bg-terminal-dark/50 border border-terminal-border rounded-lg">
                {/* Popularity Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500 min-w-[70px] sm:min-w-0">
                    {filters.popularityScore === 50
                      ? 'Balanced'
                      : filters.popularityScore < 50
                        ? 'Hidden Gems'
                        : 'Popular'}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={filters.popularityScore}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, popularityScore: parseInt(e.target.value) }))
                    }
                    className="flex-1 sm:flex-none sm:w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
                  />
                </div>

                {/* Min Review Score */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500 min-w-[70px] sm:min-w-0">
                    Min {filters.minReviewScore}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="10"
                    value={filters.minReviewScore}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, minReviewScore: parseInt(e.target.value) }))
                    }
                    className="flex-1 sm:flex-none sm:w-20 h-1.5 bg-terminal-border rounded appearance-none cursor-pointer accent-neon-cyan"
                  />
                </div>

                {/* Free to Play */}
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.isFree === true}
                    onChange={(e) =>
                      setFilters(prev => ({ ...prev, isFree: e.target.checked ? true : undefined }))
                    }
                    className="w-3.5 h-3.5 rounded border-terminal-border bg-terminal-dark accent-neon-green"
                  />
                  <span className="text-[10px] sm:text-xs font-mono text-gray-500">Free only</span>
                </label>
              </div>
            </div>

            {/* Multi-step refinement questions */}
            {conversation?.canRefine && conversation.followUpQuestions && conversation.followUpQuestions.length > 0 && (
              <div className="mb-4 sm:mb-6 terminal-box rounded-lg p-3 sm:p-5">
                {/* Header with accuracy note */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 sm:mb-4">
                  <span className="text-neon-orange font-mono text-[10px] sm:text-xs uppercase tracking-wider">
                    Refine your search
                  </span>
                  <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-neon-green/10 border border-neon-green/30 text-neon-green text-[10px] sm:text-xs font-mono rounded self-start sm:self-auto">
                    More answers = better results
                  </span>
                </div>

                {/* Questions list */}
                <div className="space-y-3 sm:space-y-4">
                  {conversation.followUpQuestions.map((q, qIndex) => {
                    const isAnswered = qIndex < collectedAnswers.length;
                    const isCurrent = qIndex === currentQuestionIndex;
                    const isUpcoming = qIndex > currentQuestionIndex;

                    return (
                      <div
                        key={qIndex}
                        className={`transition-all ${isUpcoming ? 'opacity-40' : ''}`}
                      >
                        {/* Question with status */}
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-2">
                          {isAnswered ? (
                            <span className="text-neon-green">✓</span>
                          ) : (
                            <span className="text-gray-600">{qIndex + 1}.</span>
                          )}
                          <p className={`font-mono text-xs sm:text-sm ${isAnswered ? 'text-gray-500' : 'text-neon-cyan'}`}>
                            {q.question}
                          </p>
                          {isAnswered && (
                            <span className="text-neon-green font-mono text-xs sm:text-sm">
                              → {collectedAnswers[qIndex].answer}
                            </span>
                          )}
                        </div>

                        {/* Answer chips for current question */}
                        {isCurrent && !isAnswered && (
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 ml-4 sm:ml-5">
                            {q.suggestedAnswers.map((answer, aIndex) => (
                              <button
                                key={aIndex}
                                onClick={() => {
                                  // Add answer to collected answers
                                  setCollectedAnswers(prev => [...prev, { question: q.question, answer }]);
                                  // Move to next question or trigger search if all answered
                                  if (currentQuestionIndex < conversation.followUpQuestions.length - 1) {
                                    setCurrentQuestionIndex(prev => prev + 1);
                                  }
                                  setFollowUpInput('');
                                }}
                                disabled={isLoading}
                                className="px-2 sm:px-3 py-1 sm:py-1.5 bg-terminal-dark border border-neon-cyan/50 rounded text-neon-cyan font-mono text-[10px] sm:text-sm transition-all hover:bg-neon-cyan/20 hover:border-neon-cyan disabled:opacity-50"
                              >
                                {answer}
                              </button>
                            ))}
                            {/* Custom input inline */}
                            <input
                              type="text"
                              value={followUpInput}
                              onChange={(e) => setFollowUpInput(e.target.value)}
                              placeholder="Other..."
                              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-terminal-dark border border-terminal-border rounded text-neon-cyan placeholder-gray-600 font-mono text-[10px] sm:text-sm focus:outline-none focus:border-neon-cyan transition-colors w-16 sm:w-24"
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

                {/* Search button - always visible, shows answer count */}
                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-terminal-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <span className="text-gray-500 font-mono text-[10px] sm:text-xs">
                    {collectedAnswers.length} of {conversation.followUpQuestions.length} answered
                  </span>
                  <button
                    onClick={() => {
                      if (collectedAnswers.length > 0) {
                        // Trigger search with all collected answers
                        const allAnswers = collectedAnswers.map(a => a.answer).join(', ');
                        handleFollowUpClick(allAnswers);
                        // Reset state
                        setCollectedAnswers([]);
                        setCurrentQuestionIndex(0);
                      }
                    }}
                    disabled={collectedAnswers.length === 0 || isLoading}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neon-orange/20 border border-neon-orange text-neon-orange font-mono text-xs sm:text-sm rounded hover:bg-neon-orange/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    {collectedAnswers.length === conversation.followUpQuestions.length
                      ? 'SEARCH WITH ALL ANSWERS'
                      : `SEARCH NOW (${collectedAnswers.length})`}
                  </button>
                </div>
              </div>
            )}

            {/* Results Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
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
                  {/* Header Image */}
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

                  {/* Content */}
                  <div className="p-2 sm:p-4">
                    {/* Title */}
                    <h3 className="text-white font-bold mb-1 sm:mb-2 line-clamp-1 group-hover:text-neon-cyan transition-colors orbitron text-[10px] sm:text-sm lg:text-base">
                      {game.name}
                    </h3>

                    {/* AI Reason - hidden on mobile */}
                    {game.aiReason && (
                      <div className="mb-2 sm:mb-3 p-1.5 sm:p-2 bg-neon-cyan/5 border border-neon-cyan/20 rounded hidden sm:block">
                        <p className="text-neon-cyan font-mono text-[10px] sm:text-xs line-clamp-2">
                          <span className="text-neon-orange">[AI]</span> {game.aiReason}
                        </p>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-mono mb-1 sm:mb-3">
                      {game.reviewScore !== null && (
                        <span className={`${game.reviewScore >= 80 ? 'text-neon-green' : game.reviewScore >= 60 ? 'text-neon-yellow' : 'text-gray-500'}`}>
                          {game.reviewScore}%<span className="hidden sm:inline"> positive</span>
                        </span>
                      )}
                      {game.releaseYear && (
                        <span className="text-gray-500">{game.releaseYear}</span>
                      )}
                    </div>

                    {/* Tags - hidden on mobile */}
                    {game.genres && game.genres.length > 0 && (
                      <div className="flex-wrap gap-1 hidden sm:flex">
                        {game.genres.slice(0, 3).map((genre, i) => (
                          <span
                            key={i}
                            className="px-1.5 sm:px-2 py-0.5 bg-terminal-dark text-gray-400 text-[10px] sm:text-xs font-mono rounded border border-terminal-border"
                          >
                            {typeof genre === 'string' ? genre : (genre as any).description || ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-1 sm:mt-3 text-[10px] sm:text-sm font-mono">
                      {game.isFree ? (
                        <span className="text-neon-green font-bold">FREE</span>
                      ) : game.price ? (
                        <span className="text-white">{game.price}</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Bottom accent */}
                  <div className="h-0.5 bg-terminal-border overflow-hidden">
                    <div className="h-full w-0 group-hover:w-full bg-gradient-to-r from-neon-cyan via-neon-orange to-neon-green transition-all duration-500" />
                  </div>
                </Link>
              ))}
            </div>

          </>
        )}
      </div>
    </div>
    </>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-terminal-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
        <p className="text-neon-cyan font-mono text-sm">Loading search...</p>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SearchContent />
    </Suspense>
  );
}
