import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  console.log('[Profile API] Request started');

  try {
    const supabaseUserId = request.nextUrl.searchParams.get('supabaseUserId');

    if (!supabaseUserId) {
      return NextResponse.json({ error: 'Missing supabaseUserId' }, { status: 400 });
    }

    // Verify the request is from the authenticated user
    const authStart = Date.now();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    console.log(`[Profile API] Auth check took ${Date.now() - authStart}ms`);

    if (!user || user.id !== supabaseUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find or create profile for this Supabase user
    const dbStart = Date.now();
    let profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId },
      select: {
        id: true,
        supabaseUserId: true,
        steamId: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        gamesAnalyzed: true,
        totalPlaytimeHours: true,
        feedbackLikesCount: true,
        feedbackDislikesCount: true,
        lastUpdated: true,
      },
    });

    // If no profile exists, try to find by email and link, or create new
    if (!profile && user.email) {
      const existingByEmail = await prisma.userProfile.findUnique({
        where: { email: user.email },
      });

      if (existingByEmail) {
        // Link existing profile to this Supabase user (even if it had a different supabaseUserId)
        // This handles the case where user was deleted and re-created
        profile = await prisma.userProfile.update({
          where: { id: existingByEmail.id },
          data: { supabaseUserId },
          select: {
            id: true,
            supabaseUserId: true,
            steamId: true,
            email: true,
            subscriptionTier: true,
            subscriptionExpiresAt: true,
            gamesAnalyzed: true,
            totalPlaytimeHours: true,
            feedbackLikesCount: true,
            feedbackDislikesCount: true,
            lastUpdated: true,
          },
        });
      }
    }

    // Create new profile if none exists
    if (!profile) {
      profile = await prisma.userProfile.create({
        data: {
          supabaseUserId,
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
          feedbackLikesCount: true,
          feedbackDislikesCount: true,
          lastUpdated: true,
        },
      });
    }
    console.log(`[Profile API] DB queries took ${Date.now() - dbStart}ms`);
    console.log(`[Profile API] Total request took ${Date.now() - startTime}ms`);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    // Return more details in development, generic message in production
    const errorMessage = process.env.NODE_ENV === 'development'
      ? `Failed to fetch profile: ${error instanceof Error ? error.message : String(error)}`
      : 'Failed to fetch profile';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
