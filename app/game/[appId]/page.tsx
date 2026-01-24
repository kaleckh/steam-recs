'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GameVideoSection from '@/components/game/GameVideoSection';
import GameInfoSidebar from '@/components/game/GameInfoSidebar';
import GameDescription from '@/components/game/GameDescription';
import GameTabs from '@/components/game/GameTabs';
import SimilarGames from '@/components/game/SimilarGames';
import LoadingSpinner from '@/components/game/LoadingSpinner';

export interface GameDetail {
  appId: string;
  name: string;
  type: string | null;
  releaseYear: number | null;
  reviewScore: number | null;
  reviewCount: number | null;
  metacriticScore: number | null;
  isFree: boolean | null;
  shortDescription: string | null;
  detailedDescription: string | null;
  headerImage: string | null;
  screenshots: Array<{ id: number; path_full: string; path_thumbnail: string }>;
  movies: Array<{
    id: number;
    name: string;
    thumbnail: string;
    webm?: { 480: string; max: string };
    mp4?: { 480: string; max: string };
  }>;
  price: string | null;
  priceRaw: number | null;
  discountPercent: number;
  genres: string[];
  categories: string[];
  tags: string[];
  developers: string[];
  publishers: string[];
  platforms: any;
  pcRequirements: any;
  macRequirements: any;
  linuxRequirements: any;
  releaseDate: any;
  website: string | null;
  supportInfo: any;
  recommendations: number | null;
  addedAt: string;
}

export interface SimilarGame {
  appId: string;
  name: string;
  similarity: number;
  distance: number;
  releaseYear: number | null;
  reviewScore: number | null;
  reviewCount: number | null;
  isFree: boolean | null;
  price: string | null;
  headerImage: string | null;
  genres: string[];
  developers: string[];
  shortDescription: string | null;
}

export default function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [game, setGame] = useState<GameDetail | null>(null);
  const [similarGames, setSimilarGames] = useState<SimilarGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGameData() {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch game details
        const gameResponse = await fetch(`/api/game/${appId}`);
        if (!gameResponse.ok) {
          throw new Error('Game not found');
        }
        const gameData = await gameResponse.json();
        setGame(gameData);

        // Fetch similar games
        const similarResponse = await fetch(`/api/game/${appId}/similar?limit=12`);
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          setSimilarGames(similarData.similarGames || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load game');
      } finally {
        setIsLoading(false);
      }
    }

    if (appId) {
      fetchGameData();
    }
  }, [appId]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !game) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] py-12 px-4 grid-pattern relative">
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="terminal-box rounded-lg p-12 max-w-lg mx-auto">
            <div className="terminal-header mb-6">
              <span className="text-gray-400 text-sm font-mono ml-16">ERROR_404.log</span>
            </div>
            <div className="text-neon-orange text-6xl font-bold orbitron mb-4">404</div>
            <h1 className="text-2xl font-bold text-white mb-4 orbitron">GAME NOT FOUND</h1>
            <p className="text-gray-400 mb-8 font-mono">
              {error || 'The game you are looking for does not exist in our database.'}
            </p>
            <button
              onClick={() => router.back()}
              className="btn-arcade rounded-lg inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              GO BACK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-pattern relative">
      {/* CRT Effects */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* Header with Back Button */}
      <div className="border-b border-terminal-border bg-terminal-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-neon-cyan transition-colors text-sm flex items-center gap-2 font-mono group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            <span className="text-neon-green">&gt;</span> BACK
          </button>
        </div>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="max-w-[1800px] mx-auto px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-8">
          {/* Left Column - Videos & Description */}
          <div className="space-y-8">
            <GameVideoSection game={game} />
            <GameDescription game={game} />
            <GameTabs game={game} />
          </div>

          {/* Right Column - Game Info */}
          <div>
            <GameInfoSidebar game={game} />
          </div>
        </div>

        {/* Similar Games Section */}
        <div className="mt-12">
          <SimilarGames games={similarGames} />
        </div>
      </div>
    </div>
  );
}
