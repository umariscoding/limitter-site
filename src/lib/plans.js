// Price IDs from environment variables
const PRICE_IDS = {
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO,
  elite: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE,
  override: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_OVERRIDE
};

export const PLANS = {
  free: {
    name: "Free",
    features: [
      "1 device",
      "Track 3 websites/apps",
      "1-hour fixed lockout",
      "Purchase overrides at $1.99 each"
    ]
  },
  pro: {
    name: "Pro",
    priceId: PRICE_IDS.pro,
    price: 4.99,
    features: [
      "Up to 3 devices",
      "Unlimited time tracking", 
      "Custom lockout durations",
      "15 free overrides/month",
      "AI nudges",
      "Sync + basic reports"
    ]
  },
  elite: {
    name: "Elite",
    priceId: PRICE_IDS.elite,
    price: 11.99,
    features: [
      "Up to 10 devices",
      "200 free overrides/month",
      "AI usage insights",
      "Journaling + override justification",
      "90-day encrypted usage history",
      "Smart AI recommendations"
    ]
  }
};

export const OVERRIDE_PRICE = 1.99;
export const OVERRIDE_PRICE_ID = PRICE_IDS.override;

export function getPlanFeatures(planId) {
  return PLANS[planId]?.features || [];
}

export function getPlanName(planId) {
  return PLANS[planId]?.name || 'Unknown Plan';
}

export function isValidPlan(planId) {
  return planId in PLANS;
}

export function getNextPlan(currentPlan) {
  if (currentPlan === 'free') return 'pro';
  if (currentPlan === 'pro') return 'elite';
  return null;
}

export function getPriceId(planId) {
  return PLANS[planId]?.priceId;
}

export { PRICE_IDS }; 