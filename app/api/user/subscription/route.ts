/**
 * User Subscription API Endpoint
 *
 * GET /api/user/subscription?userId=xxx - Check subscription status
 * POST /api/user/subscription - Update subscription (for testing/admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/user/subscription?userId=xxx
 *
 * Check user's subscription status
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
 * Update subscription status (for testing/admin purposes)
 *
 * Body:
 * {
 *   userId: string,
 *   tier: 'free' | 'premium',
 *   expiresAt?: string (ISO date, only for premium)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, tier, expiresAt } = body;

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing userId or tier' },
        { status: 400 }
      );
    }

    if (tier !== 'free' && tier !== 'premium') {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "free" or "premium"' },
        { status: 400 }
      );
    }

    // Calculate expiration date for premium
    let expirationDate: Date | null = null;

    if (tier === 'premium') {
      if (expiresAt) {
        expirationDate = new Date(expiresAt);
      } else {
        // Default to 30 days from now
        expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);
      }
    }

    // Update subscription
    await prisma.userProfile.update({
      where: { id: userId },
      data: {
        subscriptionTier: tier,
        subscriptionExpiresAt: expirationDate,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${tier}`,
      tier,
      expiresAt: expirationDate ? expirationDate.toISOString() : null,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update subscription',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
