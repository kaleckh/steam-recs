import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  supabaseUserId: string | null;
  steamId: string | null;
  email: string | null;
  subscriptionTier: string;
  subscriptionExpiresAt: Date | null;
  gamesAnalyzed: number;
  totalPlaytimeHours: number;
}

interface AuthResult {
  user: User | null;
  profile: UserProfile | null;
  error: string | null;
}

/**
 * Get the authenticated user and their profile from request context.
 * Use this in API route handlers to validate auth.
 */
export async function getAuthenticatedUser(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { user: null, profile: null, error: 'Not authenticated' };
    }

    // Find or create UserProfile for this Supabase user
    let profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: user.id },
      select: {
        id: true,
        supabaseUserId: true,
        steamId: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        gamesAnalyzed: true,
        totalPlaytimeHours: true,
      },
    });

    // If no profile found by supabaseUserId, try to find by email and link it
    if (!profile && user.email) {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { email: user.email },
        select: {
          id: true,
          supabaseUserId: true,
          steamId: true,
          email: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          gamesAnalyzed: true,
          totalPlaytimeHours: true,
        },
      });

      if (existingProfile && !existingProfile.supabaseUserId) {
        // Link existing profile to Supabase user
        profile = await prisma.userProfile.update({
          where: { id: existingProfile.id },
          data: { supabaseUserId: user.id },
          select: {
            id: true,
            supabaseUserId: true,
            steamId: true,
            email: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            gamesAnalyzed: true,
            totalPlaytimeHours: true,
          },
        });
      } else if (!existingProfile) {
        // Create new profile
        profile = await prisma.userProfile.create({
          data: {
            supabaseUserId: user.id,
            email: user.email,
          },
          select: {
            id: true,
            supabaseUserId: true,
            steamId: true,
            email: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            gamesAnalyzed: true,
            totalPlaytimeHours: true,
          },
        });
      }
    }

    // If still no profile, create one without email
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          supabaseUserId: user.id,
          email: user.email || null,
        },
        select: {
          id: true,
          supabaseUserId: true,
          steamId: true,
          email: true,
          subscriptionTier: true,
          subscriptionExpiresAt: true,
          gamesAnalyzed: true,
          totalPlaytimeHours: true,
        },
      });
    }

    return { user, profile, error: null };
  } catch (error) {
    console.error('Auth error:', error);
    return { user: null, profile: null, error: 'Authentication failed' };
  }
}

/**
 * Check if the user has an active premium subscription
 */
export function isPremiumUser(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.subscriptionTier !== 'premium') return false;
  if (profile.subscriptionExpiresAt && profile.subscriptionExpiresAt < new Date()) {
    return false;
  }
  return true;
}

/**
 * Return an unauthorized response
 */
export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Return a forbidden response (authenticated but not allowed)
 */
export function forbidden(message = 'Forbidden') {
  return NextResponse.json({ error: message }, { status: 403 });
}

/**
 * Verify that the authenticated user owns the requested profile.
 * Returns the profile if authorized, or an error response if not.
 */
export async function verifyUserOwnership(requestedUserId: string): Promise<{
  authorized: boolean;
  profile: UserProfile | null;
  errorResponse: NextResponse | null;
}> {
  const { profile, error } = await getAuthenticatedUser();

  if (error || !profile) {
    return {
      authorized: false,
      profile: null,
      errorResponse: unauthorized('Authentication required'),
    };
  }

  // Check if the authenticated user owns this profile
  if (profile.id !== requestedUserId) {
    return {
      authorized: false,
      profile: null,
      errorResponse: forbidden('You can only access your own data'),
    };
  }

  return {
    authorized: true,
    profile,
    errorResponse: null,
  };
}
