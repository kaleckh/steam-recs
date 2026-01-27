'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

/**
 * LIBRARY PAGE
 *
 * User's personal game collection and taste data.
 *
 * Sections:
 * - Your Taste Profile (what the AI learned about them)
 * - Rated Games (👍/👎 history)
 * - Saved/Bookmarked games
 *
 * TODO: Wire up the following:
 * 1. Fetch user's rated games (likes/dislikes) from API
 * 2. Fetch user's saved games from API
 */

type TabType = 'rated' | 'saved' | 'profile';

interface RatedGame {
  appId: string;
  name: string;
  headerImage?: string;
  rating: 'like' | 'dislike';
  ratedAt: string;
  metadata?: {
    header_image?: string;
    short_description?: string;
    genres?: string[];
    [key: string]: unknown;
  };
}

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>('rated');
  const { profile, isLoading: authLoading } = useAuth();

  const isLoggedIn = !!profile;

  // Not logged in state
  if (!authLoading && !isLoggedIn) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen relative">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
            <div className="terminal-box rounded-lg p-8">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-neon-cyan/10 border border-neon-cyan flex items-center justify-center">
                <svg className="w-8 h-8 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h1 className="orbitron text-2xl font-bold text-white mb-4">
                Sign In to Access Your Library
              </h1>

              <p className="text-gray-400 font-mono mb-6">
                Track your rated games, save favorites, and see your personalized taste profile.
              </p>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In with Steam
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Loading state
  if (authLoading) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen relative">
          <div className="flex justify-center items-center py-24">
            <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-screen relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pt-24">
          {/* Page Header */}
          <div className="terminal-box rounded-lg overflow-hidden mb-8">
            <div className="terminal-header">
              <span className="text-gray-400 text-sm font-mono ml-16">LIBRARY.exe</span>
            </div>
            <div className="p-6">
              <h1 className="orbitron text-3xl font-bold text-white mb-2">Your Library</h1>
              <p className="text-gray-400 font-mono">Your rated games and taste profile</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-terminal-border">
            <TabButton
              active={activeTab === 'rated'}
              onClick={() => setActiveTab('rated')}
              icon="👍"
              label="Rated"
            />
            <TabButton
              active={activeTab === 'saved'}
              onClick={() => setActiveTab('saved')}
              icon="🔖"
              label="Saved"
            />
            <TabButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              icon="🧬"
              label="Taste Profile"
            />
          </div>

          {/* Tab Content */}
          {activeTab === 'rated' && <RatedGamesTab userId={profile?.id} />}
          {activeTab === 'saved' && <SavedGamesTab />}
          {activeTab === 'profile' && <TasteProfileTab profile={profile} />}
        </div>
      </div>
    </>
  );
}

// Tab button component
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-3 font-mono text-sm border-b-2 transition-all -mb-px
        ${active
          ? 'border-neon-cyan text-neon-cyan'
          : 'border-transparent text-gray-400 hover:text-white'
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// Rated games tab content
function RatedGamesTab({ userId }: { userId?: string }) {
  const [ratedGames, setRatedGames] = useState<RatedGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchRatedGames = async () => {
      try {
        const response = await fetch(`/api/user/feedback?userId=${userId}`);
        const data = await response.json();
        if (data.success && data.history) {
          // Transform the API response to our RatedGame format
          const likedGames = (data.history.liked || []).map((g: { appId: string; name: string; metadata?: { header_image?: string }; createdAt: string }) => ({
            appId: g.appId,
            name: g.name,
            headerImage: g.metadata?.header_image,
            rating: 'like' as const,
            ratedAt: g.createdAt,
          }));
          const dislikedGames = (data.history.disliked || []).map((g: { appId: string; name: string; metadata?: { header_image?: string }; createdAt: string }) => ({
            appId: g.appId,
            name: g.name,
            headerImage: g.metadata?.header_image,
            rating: 'dislike' as const,
            ratedAt: g.createdAt,
          }));
          setRatedGames([...likedGames, ...dislikedGames]);
        }
      } catch (error) {
        console.error('Failed to fetch rated games:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRatedGames();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  const likedGames = ratedGames.filter(g => g.rating === 'like');
  const dislikedGames = ratedGames.filter(g => g.rating === 'dislike');
  const hasRatings = ratedGames.length > 0;

  if (!hasRatings) {
    return (
      <EmptyState
        icon="👍"
        title="No rated games yet"
        description="Rate games to help us understand your taste and improve recommendations."
        action={{ label: 'Discover Games', href: '/discover' }}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Liked games */}
      {likedGames.length > 0 && (
        <div>
          <h3 className="orbitron text-lg font-bold text-neon-green mb-4 flex items-center gap-2">
            <span>👍</span> Games You Liked ({likedGames.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {likedGames.map((game) => (
              <GameCard key={game.appId} game={game} />
            ))}
          </div>
        </div>
      )}

      {/* Disliked games */}
      {dislikedGames.length > 0 && (
        <div>
          <h3 className="orbitron text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
            <span>👎</span> Games You Disliked ({dislikedGames.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {dislikedGames.map((game) => (
              <GameCard key={game.appId} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Game card component
function GameCard({ game }: { game: RatedGame }) {
  return (
    <Link
      href={`/game/${game.appId}`}
      className="terminal-box rounded-lg overflow-hidden hover:border-neon-cyan transition-all group"
    >
      <div className="aspect-video bg-terminal-dark relative overflow-hidden">
        {game.headerImage && (
          <img
            src={game.headerImage}
            alt={game.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        )}
        <div className="absolute top-2 right-2">
          <span className={`
            px-2 py-1 rounded text-xs font-mono
            ${game.rating === 'like' ? 'bg-neon-green/20 text-neon-green' : 'bg-red-500/20 text-red-400'}
          `}>
            {game.rating === 'like' ? '👍' : '👎'}
          </span>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-mono text-sm text-white truncate group-hover:text-neon-cyan transition-colors">
          {game.name}
        </h4>
      </div>
    </Link>
  );
}

// Saved games tab content
function SavedGamesTab() {
  // TODO: Implement saved games functionality
  return (
    <EmptyState
      icon="🔖"
      title="Saved games coming soon"
      description="Bookmark games you want to check out later."
      action={{ label: 'Discover Games', href: '/discover' }}
    />
  );
}

// Taste profile tab content
function TasteProfileTab({ profile }: { profile: any }) {
  if (!profile?.topGenres?.length && !profile?.topTags?.length) {
    return (
      <EmptyState
        icon="🧬"
        title="Taste profile not ready"
        description="Rate at least 5 games to generate your personalized taste profile."
        action={{ label: 'Start Rating', href: '/discover' }}
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Top Genres */}
      <div className="terminal-box rounded-lg p-6">
        <h3 className="orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🎮</span> Top Genres
        </h3>
        {profile.topGenres?.length > 0 ? (
          <div className="space-y-3">
            {profile.topGenres.slice(0, 5).map((genre: string, i: number) => (
              <div key={genre} className="flex items-center gap-3">
                <span className="text-neon-cyan font-mono text-sm w-6">{i + 1}.</span>
                <span className="text-gray-300 font-mono">{genre}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 font-mono text-sm">Not enough data yet</p>
        )}
      </div>

      {/* Top Tags */}
      <div className="terminal-box rounded-lg p-6">
        <h3 className="orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>🏷️</span> Top Tags
        </h3>
        {profile.topTags?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.topTags.slice(0, 10).map((tag: string) => (
              <span key={tag} className="px-3 py-1 bg-terminal-dark border border-terminal-border rounded font-mono text-sm text-gray-400">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 font-mono text-sm">Not enough data yet</p>
        )}
      </div>

      {/* Stats */}
      <div className="terminal-box rounded-lg p-6 md:col-span-2">
        <h3 className="orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span>📊</span> Your Stats
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Games Analyzed" value={profile.gamesAnalyzed || 0} />
          <StatCard label="Hours Played" value={Math.round(profile.totalPlaytimeHours || 0)} />
          <StatCard label="Games Rated" value={profile.gamesRated || 0} />
          <StatCard label="Recommendations" value={profile.recommendationsViewed || 0} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-terminal-dark rounded-lg p-4 text-center">
      <p className="text-2xl font-bold text-neon-cyan orbitron">{value.toLocaleString()}</p>
      <p className="text-gray-500 font-mono text-xs mt-1">{label}</p>
    </div>
  );
}

// Empty state component
function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="text-center py-16">
      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terminal-dark border border-terminal-border flex items-center justify-center">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="orbitron text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 font-mono mb-6 max-w-md mx-auto">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-2 px-6 py-3 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
        >
          {action.label}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      )}
    </div>
  );
}
