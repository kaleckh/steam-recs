import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/reset-taste
 *
 * Resets the user's learned vector (built from likes/dislikes feedback).
 * The preference vector (from Steam library) is preserved.
 *
 * Options:
 * - clearFeedbackHistory: boolean (default: false) - Also delete all feedback records
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clearFeedbackHistory = body.clearFeedbackHistory === true;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Find user profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { supabaseUserId: supabaseUser.id },
      select: {
        id: true,
        feedbackLikesCount: true,
        feedbackDislikesCount: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Reset learned vector to NULL (will re-initialize from preference vector on next feedback)
    await prisma.$executeRaw`
      UPDATE user_profiles
      SET
        learned_vector = NULL,
        updated_at = NOW()
      WHERE id = ${userProfile.id}
    `;

    let feedbackDeleted = 0;

    // Optionally clear feedback history
    if (clearFeedbackHistory) {
      const deleteResult = await prisma.userFeedback.deleteMany({
        where: { userId: userProfile.id },
      });
      feedbackDeleted = deleteResult.count;

      // Reset feedback counts
      await prisma.userProfile.update({
        where: { id: userProfile.id },
        data: {
          feedbackLikesCount: 0,
          feedbackDislikesCount: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: clearFeedbackHistory
        ? `Taste training reset. ${feedbackDeleted} ratings cleared.`
        : 'Taste training reset. Your rating history was preserved.',
      feedbackDeleted,
      previousLikes: userProfile.feedbackLikesCount,
      previousDislikes: userProfile.feedbackDislikesCount,
    });
  } catch (error) {
    console.error('Error resetting taste:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset taste training' },
      { status: 500 }
    );
  }
}
