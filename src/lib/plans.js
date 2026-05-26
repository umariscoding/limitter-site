export const PRODUCT_IDS = {
  pro: "prod_UaYNz8gFQXlGBS",
  pro_yearly: "prod_UaYQLUL7LekgRr",
  elite: "prod_UaYOmyxtZ2Btfq",
  elite_yearly: "prod_UaYRE2xypsrKxh",
  ultra_elite: "prod_UaYOv1BOSbGuJq",
  ultra_elite_yearly: "prod_UaYRIcXTL5qbkv",
  override: "prod_UaYRNbl8CtHWxt",
};

export const PLANS = {
  free: {
    name: "Free",
    productId: null,
    monthlyPrice: 0,
    yearlyPrice: 0,
    monthlyLabel: "$0 / mo",
    yearlyLabel: "$0 / yr",
    supportsCycle: false,
    badge: null,
    features: [
      { text: "1 device", enabled: true },
      { text: "3 websites/apps", enabled: true },
      { text: "1-hour fixed lockout", enabled: true },
      { text: "$1.99 per override", enabled: true },
      { text: "Custom timers", enabled: false },
      { text: "AI features", enabled: false },
    ],
  },
  pro: {
    name: "Pro",
    productId: PRODUCT_IDS.pro,
    yearlyProductId: PRODUCT_IDS.pro_yearly,
    monthlyPrice: 4.99,
    yearlyPrice: 53.89,
    monthlyLabel: "$4.99 / mo",
    yearlyLabel: "$53.89 / yr",
    supportsCycle: true,
    badge: null,
    features: [
      { text: "Up to 3 devices", enabled: true },
      { text: "Unlimited tracking", enabled: true },
      { text: "Custom lockout durations", enabled: true },
      { text: "15 free overrides/month", enabled: true },
      { text: "AI nudges", enabled: true },
      { text: "Cross-device sync + reports", enabled: true },
    ],
  },
  elite: {
    name: "Elite",
    productId: PRODUCT_IDS.elite,
    yearlyProductId: PRODUCT_IDS.elite_yearly,
    monthlyPrice: 11.99,
    yearlyPrice: 129.49,
    monthlyLabel: "$11.99 / mo",
    yearlyLabel: "$129.49 / yr",
    supportsCycle: true,
    badge: "Most Popular",
    features: [
      { text: "Up to 10 devices", enabled: true },
      { text: "Unlimited overrides", enabled: true },
      { text: "AI usage insights", enabled: true },
      { text: "Journaling", enabled: true },
      { text: "90-day encrypted history", enabled: true },
      { text: "Smart AI recommendations", enabled: true },
    ],
  },
  ultra_elite: {
    name: "Ultra Elite",
    productId: PRODUCT_IDS.ultra_elite,
    yearlyProductId: PRODUCT_IDS.ultra_elite_yearly,
    monthlyPrice: 19.99,
    yearlyPrice: 215.89,
    monthlyLabel: "$19.99 / mo",
    yearlyLabel: "$215.89 / yr",
    supportsCycle: true,
    badge: "Best Value",
    features: [
      { text: "Unlimited devices", enabled: true },
      { text: "Unlimited overrides", enabled: true },
      { text: "AI usage insights", enabled: true },
      { text: "Journaling", enabled: true },
      { text: "90-day encrypted history", enabled: true },
      { text: "Smart AI recommendations", enabled: true },
    ],
  },
};

export const OVERRIDE_PRICE = 1.99;
export const OVERRIDE_PRODUCT_ID = PRODUCT_IDS.override;

export function getPlanFeatures(planId) {
  return PLANS[planId]?.features || [];
}

export function getPlanName(planId) {
  return PLANS[planId]?.name || "Unknown Plan";
}

export function isValidPlan(planId) {
  return planId in PLANS;
}

export function getNextPlan(currentPlan) {
  if (currentPlan === "free") return "pro";
  if (currentPlan === "pro") return "elite";
  if (currentPlan === "elite") return "ultra_elite";
  return null;
}

export function getProductId(planId, cycle = "monthly") {
  const plan = PLANS[planId];
  if (!plan) return null;
  if (cycle === "yearly" && plan.yearlyProductId) return plan.yearlyProductId;
  return plan.productId;
}
