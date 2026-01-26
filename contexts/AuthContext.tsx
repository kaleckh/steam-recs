'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  supabaseUserId: string | null;
  steamId: string | null;
  email: string | null;
  subscriptionTier: string;
  subscriptionExpiresAt: string | null;
  gamesAnalyzed: number;
  totalPlaytimeHours: number;
}

export interface CachedRecommendations {
  recommendations: unknown[];
  gamesAnalyzed: number;
  totalPlaytimeHours?: number;
  lastUpdated: Date;
  topGames?: unknown[];
  ratingsCount?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isPremium: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  cachedRecommendations: CachedRecommendations | null;
  setCachedRecommendations: (data: CachedRecommendations | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cachedRecommendations, setCachedRecommendations] = useState<CachedRecommendations | null>(null);
  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (supabaseUserId: string) => {
    try {
      const res = await fetch(`/api/user/profile?supabaseUserId=${supabaseUserId}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      } else {
        console.error('Profile fetch failed:', res.status, await res.text());
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        if (initialSession?.user) {
          await fetchProfile(initialSession.user.id);
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Check if user is premium
  const isPremium = (() => {
    if (!profile) return false;
    if (profile.subscriptionTier !== 'premium') return false;
    if (profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) < new Date()) {
      return false;
    }
    return true;
  })();

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isPremium,
        signOut,
        refreshProfile,
        cachedRecommendations,
        setCachedRecommendations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
