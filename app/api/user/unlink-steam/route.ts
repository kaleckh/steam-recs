import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/unlink-steam
 *
 * Removes the linked Steam account from the user's profile.
 * This will:
 * - Delete all UserGame records for this user
 * - Clear the steamId from the profile
 * - Reset gamesAnalyzed and totalPlaytimeHours
 * - Clear the preference vector
 */
export async function POST() {
  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the user's profile
    const profile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (!profile.steamId) {
      return NextResponse.json({ error: 'No Steam account linked' }, { status: 400 });
    }

    // Delete all UserGame records for this user
    const deletedGames = await prisma.userGame.deleteMany({
      where: { userId: profile.id },
    });

    // Update the profile to remove Steam data
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET
        steam_id = NULL,
        games_analyzed = 0,
        total_playtime_hours = 0,
        preference_vector = NULL,
        last_updated = NOW()
      WHERE id = ${profile.id}
    `;

    console.log(`[Unlink Steam] Removed Steam account for user ${profile.id}. Deleted ${deletedGames.count} games.`);

    return NextResponse.json({
      success: true,
      message: 'Steam account unlinked successfully',
      gamesDeleted: deletedGames.count,
    });
  } catch (error) {
    console.error('Unlink Steam error:', error);
    return NextResponse.json(
      { error: 'Failed to unlink Steam account' },
      { status: 500 }
    );
  }
}
