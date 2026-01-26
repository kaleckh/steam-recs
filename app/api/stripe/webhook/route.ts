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
        const customerEmail = session.customer_details?.email;

        console.log('Checkout completed:', { userId, subscriptionId, customerEmail });

        if (subscriptionId) {
          const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
          // Stripe types don't expose current_period_end directly, access via any
          const periodEnd = (subscription as unknown as { current_period_end: number }).current_period_end;

          // Try to find user by ID first, then fall back to email
          let userProfile = userId
            ? await prisma.userProfile.findUnique({ where: { id: userId } })
            : null;

          // If user ID not found, try by email (handles profile recreation)
          if (!userProfile && customerEmail) {
            console.log('User not found by ID, trying email:', customerEmail);
            userProfile = await prisma.userProfile.findUnique({ where: { email: customerEmail } });
          }

          if (userProfile) {
            console.log('Updating user profile:', userProfile.id);
            await prisma.userProfile.update({
              where: { id: userProfile.id },
              data: {
                subscriptionTier: 'premium',
                stripeSubscriptionId: subscriptionId,
                subscriptionExpiresAt: new Date(periodEnd * 1000),
                ...(customerEmail && { email: customerEmail }),
              },
            });
            console.log('User upgraded to premium successfully');
          } else {
            console.error('No user profile found for checkout:', { userId, customerEmail });
          }
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Webhook handler error:', { message: errorMessage, stack: errorStack, eventType: event.type });
    return NextResponse.json({ error: 'Webhook handler failed', details: errorMessage }, { status: 500 });
  }
}
