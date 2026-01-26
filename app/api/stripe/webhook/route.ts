import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          const customerEmail = session.customer_details?.email;
          // Stripe types don't expose current_period_end directly, access via any
          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

          await prisma.userProfile.update({
            where: { id: userId },
            data: {
              subscriptionTier: 'premium',
              stripeSubscriptionId: subscriptionId,
              subscriptionExpiresAt: new Date(periodEnd * 1000),
              ...(customerEmail && { email: customerEmail }),
            },
          });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

        await prisma.userProfile.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionTier: subscription.status === 'active' ? 'premium' : 'free',
            subscriptionExpiresAt: new Date(periodEnd * 1000),
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        await prisma.userProfile.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            subscriptionTier: 'free',
            stripeSubscriptionId: null,
            subscriptionExpiresAt: null,
          },
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as unknown as { subscription: string | null }).subscription;

        if (subscriptionId) {
          await prisma.userProfile.updateMany({
            where: { stripeSubscriptionId: subscriptionId },
            data: {
              subscriptionTier: 'free',
            },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
