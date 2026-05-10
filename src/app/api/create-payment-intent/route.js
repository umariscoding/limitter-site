import Stripe from 'stripe';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { amount, paymentType, quantity, plan } = await request.json()
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), 
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        paymentType,
        quantity: quantity || 1,
        plan: plan || null
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error('Error creating payment intent:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 