/**
 * User Subscription API Endpoint
 *
 * GET /api/user/subscription?userId=xxx - Check subscription status (requires auth)
 * POST /api/user/subscription - Update subscription (admin/Stripe webhook only)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyUserOwnership } from '@/lib/auth';

/**
 * GET /api/user/subscription?userId=xxx
 *
 * Check user's subscription status (requires authentication)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Verify the authenticated user owns this profile
    const { authorized, errorResponse } = await verifyUserOwnership(userId);
    if (!authorized) {
      return errorResponse!;
    }

    // Fetch user subscription info
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        feedbackLikesCount: true,
        feedbackDislikesCount: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const isPremium = userProfile.subscriptionTier === 'premium';
    const expiresAt = userProfile.subscriptionExpiresAt;
    const isExpired = expiresAt && new Date(expiresAt) < new Date();
    const isActive = isPremium && !isExpired;

    // Calculate days remaining
    let daysRemaining = 0;
    if (expiresAt && !isExpired) {
      const now = new Date();
      const expires = new Date(expiresAt);
      daysRemaining = Math.ceil(
        (expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return NextResponse.json({
      success: true,
      tier: userProfile.subscriptionTier,
      isPremium: isActive,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
      daysRemaining,
      isExpired,
      features: {
        unlimitedResults: isActive,
        feedbackLearning: isActive,
        advancedFilters: isActive,
        notInterestedList: isActive,
      },
      stats: {
        feedbackLikesCount: userProfile.feedbackLikesCount,
        feedbackDislikesCount: userProfile.feedbackDislikesCount,
        totalFeedback:
          userProfile.feedbackLikesCount + userProfile.feedbackDislikesCount,
      },
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription status',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/subscription
 *
 * Update subscription status
 * NOTE: This endpoint is disabled for direct access.
 * Subscription changes should only happen via Stripe webhooks.
 * Keeping for potential admin use in future with proper auth.
 */
export async function POST() {
  // Disabled for security - subscription changes should only happen via Stripe webhooks
  return NextResponse.json(
    { error: 'Subscription changes must be made through the billing portal' },
    { status: 403 }
  );
}
