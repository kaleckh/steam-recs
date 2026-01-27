import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { CREDIT_PACKAGES, CreditPackageId } from '@/lib/beta-limits';

export async function POST(request: NextRequest) {
  try {
    // Check required env vars
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { userId, packageId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    if (!packageId || !CREDIT_PACKAGES[packageId as CreditPackageId]) {
      return NextResponse.json({ error: 'Invalid package' }, { status: 400 });
    }

    const selectedPackage = CREDIT_PACKAGES[packageId as CreditPackageId];

    // Get or create Stripe customer
    const user = await prisma.userProfile.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email || undefined,
        metadata: {
          userId: userId,
          steamId: user.steamId || '',
        },
      });
      customerId = customer.id;

      await prisma.userProfile.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Create checkout session for one-time payment
    const appUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'payment', // One-time payment, not subscription
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${selectedPackage.name} - ${selectedPackage.credits} AI Searches`,
              description: `${selectedPackage.credits} AI-powered game searches. Credits never expire.`,
            },
            unit_amount: selectedPackage.price, // Price in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/search?purchased=true&credits=${selectedPackage.credits}`,
      cancel_url: `${appUrl}/search`,
      metadata: {
        userId: userId,
        packageId: packageId,
        credits: selectedPackage.credits.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
