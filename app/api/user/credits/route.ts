import { NextRequest, NextResponse } from 'next/server';
import { getSearchCreditStatus, FREE_SEARCH_LIMIT, CREDIT_PACKAGES } from '@/lib/beta-limits';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  const status = await getSearchCreditStatus(userId);

  if (!status) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({
    purchasedCredits: status.purchasedCredits,
    freeSearchesUsed: status.freeSearchesUsed,
    freeSearchesRemaining: status.freeSearchesRemaining,
    totalRemaining: status.totalSearchesRemaining,
    freeLimit: FREE_SEARCH_LIMIT,
    packages: CREDIT_PACKAGES,
  });
}
