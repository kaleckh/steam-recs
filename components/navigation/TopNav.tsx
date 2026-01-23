'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SearchResult {
  appId: string;
  name: string;
  headerImage: string | null;
  reviewScore: number | null;
  releaseYear: number | null;
  price: string | null;
}

export default function TopNav() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&type=basic&limit=10`);
        const data = await response.json();

        if (data.success) {
          setSearchResults(data.games);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const handleGameClick = (appId: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/game/${appId}`);
  };

  // Detect if query looks semantic
  const isSemanticQuery = (query: string) => {
    const semanticKeywords = ['like', 'similar', 'but', 'with', 'without', 'type of', 'kind of', 'style'];
    const lowerQuery = query.toLowerCase();
    return semanticKeywords.some(keyword => lowerQuery.includes(keyword));
  };

  const handleSemanticSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}&type=semantic`);
      setShowDropdown(false);
      setSearchQuery('');
    }
  };

  const showSemanticPrompt = searchQuery.length > 5 && isSemanticQuery(searchQuery);

  return (
    <nav className="bg-[#171a21] border-b border-[#2a475e] sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="text-white font-bold text-xl hover:text-[#66c0f4] transition-colors whitespace-nowrap">
            Steam Recs
          </Link>

          {/* Search Bar */}
          <div ref={searchRef} className="flex-1 max-w-2xl relative">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search games... or try 'adventure strategy game like Risk'"
                className="w-full bg-[#316282] text-white placeholder-[#8f98a0] px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-[#66c0f4]"
              />
              <svg
                className="absolute right-3 top-2.5 w-5 h-5 text-[#8f98a0]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Search Dropdown */}
            {showDropdown && (
              <div className="absolute top-full mt-2 w-full bg-[#16202d] rounded shadow-xl border border-[#2a475e] max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="p-4 text-center text-[#8f98a0]">
                    Searching...
                  </div>
                ) : (
                  <>
                    {/* Semantic Search Prompt */}
                    {showSemanticPrompt && (
                      <button
                        onClick={handleSemanticSearch}
                        className="w-full p-4 hover:bg-[#2a475e] transition-colors border-b border-[#2a475e] text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-gradient-to-r from-[#06BFFF] to-[#2571CE] p-2 rounded">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-[#66c0f4] font-medium">Try AI-Powered Search</div>
                            <div className="text-[#8f98a0] text-sm">Find games by description: "{searchQuery}"</div>
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Search Results */}
                    {searchResults.length > 0 ? (
                      <>
                        <div className="p-3 text-xs text-[#8f98a0] border-b border-[#2a475e]">
                          Found {searchResults.length} games
                        </div>
                        {searchResults.map((game) => (
                          <button
                            key={game.appId}
                            onClick={() => handleGameClick(game.appId)}
                            className="w-full p-3 hover:bg-[#2a475e] transition-colors flex items-center gap-3"
                          >
                            {game.headerImage ? (
                              <img
                                src={game.headerImage}
                                alt={game.name}
                                className="w-20 h-9 object-cover rounded"
                              />
                            ) : (
                              <div className="w-20 h-9 bg-[#2a475e] rounded" />
                            )}
                            <div className="flex-1 text-left">
                              <div className="text-white font-medium text-sm">{game.name}</div>
                              <div className="flex items-center gap-2 text-xs text-[#8f98a0]">
                                {game.reviewScore !== null && (
                                  <span className="text-[#66c0f4]">{game.reviewScore}%</span>
                                )}
                                {game.releaseYear && <span>{game.releaseYear}</span>}
                                {game.price && <span className="text-white">{game.price}</span>}
                              </div>
                            </div>
                          </button>
                        ))}
                      </>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-[#8f98a0]">
                        No games found. Try AI search above!
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-6 whitespace-nowrap">
            <Link
              href="/profile"
              className="text-[#c7d5e0] hover:text-white transition-colors"
            >
              My Profile
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
