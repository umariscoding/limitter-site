import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { PLANS, OVERRIDE_PRICE_ID } from '../../../lib/plans';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function GET() {
  try {
    const priceIds = [
      ...Object.values(PLANS)
        .filter(plan => plan.priceId)
        .map(plan => plan.priceId),
      OVERRIDE_PRICE_ID
    ].filter(Boolean);

    if (!priceIds.length) {
      console.error('No price IDs found in configuration');
      return NextResponse.json({ error: 'No prices configured' }, { status: 500 });
    }

    const prices = await stripe.prices.list({
      active: true,
      ids: priceIds
    });

    if (!prices.data.length) {
      console.error('No active prices found in Stripe');
      return NextResponse.json({ error: 'No active prices found' }, { status: 404 });
    }

    const priceMap = {};
    prices.data.forEach(price => {
      if (price.active) {
        priceMap[price.id] = price.unit_amount;
      }
    });

    const missingPrices = priceIds.filter(id => !priceMap[id]);
    if (missingPrices.length) {
      console.error('Some prices not found:', missingPrices);
      return NextResponse.json({ error: 'Some prices not available' }, { status: 404 });
    }

    return NextResponse.json({ prices: priceMap });
  } catch (err) {
    console.error('Error fetching prices:', err);
    return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 500 });
  }
} 