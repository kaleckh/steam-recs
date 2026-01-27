import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Search Credits System
 *
 * - Free users: 6 searches (beta)
 * - Purchased credits: Use purchased credits first, then fall back to free tier
 *
 * Credit packages:
 * - 50 searches for $5
 * - 200 searches for $15
 */

// Configuration
export const FREE_SEARCH_LIMIT = 6;

// Credit packages
export const CREDIT_PACKAGES = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    credits: 50,
    price: 500, // in cents
    priceDisplay: '$5',
    priceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
  },
  power: {
    id: 'power',
    name: 'Power Pack',
    credits: 200,
    price: 1500, // in cents
    priceDisplay: '$15',
    priceId: process.env.STRIPE_PRICE_POWER || 'price_power',
    savings: '25% more value',
  },
} as const;

export type CreditPackageId = keyof typeof CREDIT_PACKAGES;

export interface SearchLimitStatus {
  allowed: boolean;
  // Credits info
  purchasedCredits: number;
  freeSearchesUsed: number;
  freeSearchesRemaining: number;
  totalSearchesRemaining: number;
  // Meta
  hasPurchasedCredits: boolean;
  usingFreeSearches: boolean;
  errorResponse?: NextResponse;
}

/**
 * Check if user can perform a search.
 * Priority: Use purchased credits first, then free tier.
 *
 * @param userId - The user's profile ID
 * @returns SearchLimitStatus with allowed status and credit info
 */
export async function checkSearchLimit(userId: string): Promise<SearchLimitStatus> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        searchCredits: true,
        betaQueriesUsed: true,
      },
    });

    if (!profile) {
      return {
        allowed: false,
        purchasedCredits: 0,
        freeSearchesUsed: 0,
        freeSearchesRemaining: 0,
        totalSearchesRemaining: 0,
        hasPurchasedCredits: false,
        usingFreeSearches: false,
        errorResponse: NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        ),
      };
    }

    const purchasedCredits = profile.searchCredits;
    const freeSearchesUsed = profile.betaQueriesUsed;
    const freeSearchesRemaining = Math.max(0, FREE_SEARCH_LIMIT - freeSearchesUsed);
    const hasPurchasedCredits = purchasedCredits > 0;

    // Total available = purchased + remaining free
    const totalSearchesRemaining = purchasedCredits + freeSearchesRemaining;

    // User can search if they have purchased credits OR free searches remaining
    const allowed = totalSearchesRemaining > 0;

    if (!allowed) {
      return {
        allowed: false,
        purchasedCredits,
        freeSearchesUsed,
        freeSearchesRemaining: 0,
        totalSearchesRemaining: 0,
        hasPurchasedCredits,
        usingFreeSearches: false,
        errorResponse: NextResponse.json(
          {
            error: 'No searches remaining',
            message: `You've used all your free searches. Purchase credits to continue!`,
            code: 'NO_SEARCHES_REMAINING',
            freeSearchesUsed,
            freeLimit: FREE_SEARCH_LIMIT,
            purchasedCredits: 0,
            packages: CREDIT_PACKAGES,
          },
          { status: 429 }
        ),
      };
    }

    return {
      allowed: true,
      purchasedCredits,
      freeSearchesUsed,
      freeSearchesRemaining,
      totalSearchesRemaining,
      hasPurchasedCredits,
      // Will use purchased credits first if available
      usingFreeSearches: !hasPurchasedCredits,
    };
  } catch (error) {
    console.error('Error checking search limit:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      purchasedCredits: 0,
      freeSearchesUsed: 0,
      freeSearchesRemaining: FREE_SEARCH_LIMIT,
      totalSearchesRemaining: FREE_SEARCH_LIMIT,
      hasPurchasedCredits: false,
      usingFreeSearches: true,
    };
  }
}

/**
 * Consume one search credit.
 * Priority: Use purchased credits first, then free tier.
 *
 * @param userId - The user's profile ID
 * @returns Updated status after consuming a credit
 */
export async function consumeSearchCredit(userId: string): Promise<{
  success: boolean;
  usedPurchasedCredit: boolean;
  purchasedCreditsRemaining: number;
  freeSearchesRemaining: number;
}> {
  try {
    // First, check current status
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        searchCredits: true,
        betaQueriesUsed: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        usedPurchasedCredit: false,
        purchasedCreditsRemaining: 0,
        freeSearchesRemaining: 0,
      };
    }

    // If user has purchased credits, use those first
    if (profile.searchCredits > 0) {
      const updated = await prisma.userProfile.update({
        where: { id: userId },
        data: {
          searchCredits: { decrement: 1 },
        },
        select: {
          searchCredits: true,
          betaQueriesUsed: true,
        },
      });

      return {
        success: true,
        usedPurchasedCredit: true,
        purchasedCreditsRemaining: updated.searchCredits,
        freeSearchesRemaining: Math.max(0, FREE_SEARCH_LIMIT - updated.betaQueriesUsed),
      };
    }

    // Otherwise, use free tier (increment betaQueriesUsed)
    const freeRemaining = FREE_SEARCH_LIMIT - profile.betaQueriesUsed;
    if (freeRemaining <= 0) {
      return {
        success: false,
        usedPurchasedCredit: false,
        purchasedCreditsRemaining: 0,
        freeSearchesRemaining: 0,
      };
    }

    const updated = await prisma.userProfile.update({
      where: { id: userId },
      data: {
        betaQueriesUsed: { increment: 1 },
      },
      select: {
        searchCredits: true,
        betaQueriesUsed: true,
      },
    });

    return {
      success: true,
      usedPurchasedCredit: false,
      purchasedCreditsRemaining: updated.searchCredits,
      freeSearchesRemaining: Math.max(0, FREE_SEARCH_LIMIT - updated.betaQueriesUsed),
    };
  } catch (error) {
    console.error('Error consuming search credit:', error);
    return {
      success: false,
      usedPurchasedCredit: false,
      purchasedCreditsRemaining: 0,
      freeSearchesRemaining: 0,
    };
  }
}

/**
 * Add purchased credits to a user's account.
 * Called after successful Stripe payment.
 *
 * @param userId - The user's profile ID
 * @param credits - Number of credits to add
 */
export async function addPurchasedCredits(userId: string, credits: number): Promise<{
  success: boolean;
  newBalance: number;
}> {
  try {
    const updated = await prisma.userProfile.update({
      where: { id: userId },
      data: {
        searchCredits: { increment: credits },
        totalCreditsPurchased: { increment: credits },
      },
      select: {
        searchCredits: true,
      },
    });

    return {
      success: true,
      newBalance: updated.searchCredits,
    };
  } catch (error) {
    console.error('Error adding purchased credits:', error);
    return {
      success: false,
      newBalance: 0,
    };
  }
}

/**
 * Get the current search credit status for a user.
 * Useful for displaying in the UI.
 *
 * @param userId - The user's profile ID
 */
export async function getSearchCreditStatus(userId: string): Promise<{
  purchasedCredits: number;
  freeSearchesUsed: number;
  freeSearchesRemaining: number;
  totalSearchesRemaining: number;
  totalCreditsPurchased: number;
} | null> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: {
        searchCredits: true,
        betaQueriesUsed: true,
        totalCreditsPurchased: true,
      },
    });

    if (!profile) return null;

    const freeSearchesRemaining = Math.max(0, FREE_SEARCH_LIMIT - profile.betaQueriesUsed);

    return {
      purchasedCredits: profile.searchCredits,
      freeSearchesUsed: profile.betaQueriesUsed,
      freeSearchesRemaining,
      totalSearchesRemaining: profile.searchCredits + freeSearchesRemaining,
      totalCreditsPurchased: profile.totalCreditsPurchased,
    };
  } catch {
    return null;
  }
}

// Legacy exports for backwards compatibility
export const BETA_QUERY_LIMIT = FREE_SEARCH_LIMIT;
export const checkBetaLimit = checkSearchLimit;
export const incrementBetaQueryCount = async (userId: string) => {
  const result = await consumeSearchCredit(userId);
  return result.freeSearchesRemaining;
};
