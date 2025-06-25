import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { PRICE_IDS, isValidPlan } from '../../../lib/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' 
});

export async function POST(request) {
  try {
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('BASE_URL not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { paymentType, quantity, plan, userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let session;

    if (paymentType === 'plan') {
      if (!plan || !isValidPlan(plan)) {
        return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
      }

      const priceId = PRICE_IDS[plan];
      if (!priceId) {
        return NextResponse.json({ error: 'Plan price not configured' }, { status: 400 });
      }

      try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.active) {
          return NextResponse.json({ error: 'Selected plan is not available' }, { status: 400 });
        }
      } catch (err) {
        return NextResponse.json({ error: 'Invalid plan price' }, { status: 400 });
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=cancelled`,
        metadata: {
          userId,
          paymentType: 'plan',
          plan
        }
      });
    } else if (paymentType === 'overrides') {
      if (!quantity || quantity < 1 || quantity > 100) {
        return NextResponse.json({ error: 'Invalid override quantity' }, { status: 400 });
      }

      const priceId = PRICE_IDS.override;
      if (!priceId) {
        console.error('Override price ID not configured');
        return NextResponse.json({ error: 'Override price not configured' }, { status: 400 });
      }

      try {
        const price = await stripe.prices.retrieve(priceId);
        if (!price.active) {
          return NextResponse.json({ error: 'Overrides are not available for purchase' }, { status: 400 });
        }
      } catch (err) {
        console.error('Error validating override price:', err);
        return NextResponse.json({ error: 'Invalid override price' }, { status: 400 });
      }

      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price: priceId,
            quantity: quantity,
          },
        ],
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=cancelled`,
        metadata: {
          userId,
          paymentType: 'overrides',
          quantity: quantity.toString()
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
    }

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    return NextResponse.json({ 
      error: 'Failed to create checkout session',
      details: err.message
    }, { status: 500 });
  }
} 