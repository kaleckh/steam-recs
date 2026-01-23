'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

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
  shortDescription: string | null;
  price: string | null;
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const searchType = searchParams.get('type') || 'semantic';

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function performSearch() {
      if (!query) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=50`
        );
        const data = await response.json();

        if (data.success) {
          setResults(data.games);
        } else {
          setError(data.error || 'Search failed');
        }
      } catch (err) {
        setError('Failed to perform search');
      } finally {
        setIsLoading(false);
      }
    }

    performSearch();
  }, [query, searchType]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1b2838] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#66c0f4] mx-auto mb-4"></div>
          <p className="text-[#c7d5e0] text-lg">Searching for: "{query}"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838]">
      {/* Header */}
      <div className="bg-[#171a21] border-b border-[#2a475e]">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="text-[#c7d5e0] hover:text-white transition-colors text-sm flex items-center gap-2 mb-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">
            {searchType === 'semantic' ? 'AI Search Results' : 'Search Results'}
          </h1>
          <p className="text-[#c7d5e0]">
            Showing results for: <span className="text-[#66c0f4]">"{query}"</span>
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        {error ? (
          <div className="bg-[#16202d] rounded p-8 text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.back()}
              className="bg-[#66c0f4] hover:bg-[#417a9b] text-white px-6 py-2 rounded transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : results.length === 0 ? (
          <div className="bg-[#16202d] rounded p-8 text-center">
            <p className="text-[#c7d5e0] text-lg mb-2">No games found</p>
            <p className="text-[#8f98a0] mb-4">Try a different search query</p>
            <button
              onClick={() => router.back()}
              className="bg-[#66c0f4] hover:bg-[#417a9b] text-white px-6 py-2 rounded transition-colors"
            >
              Go Back
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-[#8f98a0]">
              Found {results.length} {results.length === 1 ? 'game' : 'games'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.map((game) => (
                <Link
                  key={game.appId}
                  href={`/game/${game.appId}`}
                  className="bg-[#16202d] rounded overflow-hidden hover:bg-[#1e2837] transition-all group"
                >
                  {/* Header Image */}
                  {game.headerImage ? (
                    <img
                      src={game.headerImage}
                      alt={game.name}
                      className="w-full aspect-[460/215] object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-[460/215] bg-[#2a475e] flex items-center justify-center">
                      <span className="text-[#8f98a0] text-sm">No image</span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-4">
                    {/* Title */}
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-[#66c0f4] transition-colors">
                      {game.name}
                    </h3>

                    {/* Similarity Badge (if semantic search) */}
                    {game.similarity !== undefined && (
                      <div className="mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            game.similarity >= 0.8
                              ? 'bg-[#5c7e10] text-white'
                              : game.similarity >= 0.6
                              ? 'bg-[#4c6b22] text-white'
                              : 'bg-[#8f98a0]/20 text-[#8f98a0]'
                          }`}
                        >
                          {Math.round(game.similarity * 100)}% Match
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {game.shortDescription && (
                      <p className="text-[#8f98a0] text-sm mb-3 line-clamp-2">
                        {game.shortDescription}
                      </p>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm">
                      {/* Review Score */}
                      {game.reviewScore !== null && (
                        <div className="flex items-center gap-1 text-[#66c0f4]">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>{game.reviewScore}%</span>
                        </div>
                      )}

                      {/* Release Year */}
                      {game.releaseYear && (
                        <span className="text-[#8f98a0]">{game.releaseYear}</span>
                      )}
                    </div>

                    {/* Genres */}
                    {game.genres && game.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {game.genres.slice(0, 3).map((genre, i) => (
                          <span
                            key={i}
                            className="bg-[#2a475e]/50 text-[#c7d5e0] px-2 py-0.5 rounded text-xs"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mt-3 text-sm">
                      {game.isFree ? (
                        <span className="text-[#5c7e10] font-semibold">Free to Play</span>
                      ) : game.price ? (
                        <span className="text-white font-semibold">{game.price}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
