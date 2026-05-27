export const PLAN_BADGES = {
  free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  elite: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  ultra_elite: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

export function formatPlanName(plan) {
  if (!plan) return "Free";
  if (plan === "ultra_elite") return "Ultra Elite";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function formatMinutes(totalMinutes = 0) {
  if (totalMinutes <= 0) return "0m";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatTimeLimit(totalSeconds = 1800) {
  return formatMinutes(totalSeconds / 60);
}

export function getAverageTimeLimit(policies = []) {
  const active = policies.filter((p) => p.isActive !== false && !p.isArchived);
  if (!active.length) return "0m";
  const totalMinutes = active.reduce(
    (sum, p) => sum + (p.dailyLimitMinutes || 0),
    0,
  );
  return formatMinutes(Math.floor(totalMinutes / active.length));
}

export function getPolicyStatus(policy) {
  const state = policy.state || {};
  if (state.isExhaustedToday || state.isLocked) {
    return {
      label: "Blocked",
      className: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    };
  }
  if (policy.isActive !== false) {
    return {
      label: "Active",
      className: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    };
  }
  return {
    label: "Inactive",
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };
}

export function getSiteStatus(site) {
  if (site._raw) return getPolicyStatus(site._raw);
  if (site.time_remaining === 0 || site.is_blocked) {
    return {
      label: "Blocked",
      className: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    };
  }
  if (site.is_active !== false) {
    return {
      label: "Active",
      className: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    };
  }
  return {
    label: "Inactive",
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };
}

export function getPolicyTypeLabel(type) {
  switch (type) {
    case "website": return "Website";
    case "app": return "App";
    case "category": return "Category";
    default: return type || "Unknown";
  }
}

export function getSubscriptionFeatures(plan) {
  const currentPlan = plan || "free";
  const deviceLabel = {
    free: "1 device, up to 3 limits",
    pro: "Up to 3 devices, unlimited limits",
    elite: "Up to 10 devices, unlimited limits",
    ultra_elite: "Unlimited devices, unlimited limits",
  };
  const overrideLabel = {
    free: "$1.99 per override",
    pro: "15 free overrides/month",
    elite: "Unlimited overrides",
    ultra_elite: "Unlimited overrides",
  };

  const features = [
    "Smart website & app blocking",
    deviceLabel[currentPlan] || deviceLabel.free,
    "Custom daily timers",
    overrideLabel[currentPlan] || overrideLabel.free,
  ];

  if (currentPlan === "pro" || currentPlan === "elite" || currentPlan === "ultra_elite") {
    features.push("Cross-device sync + reports");
    features.push("AI nudges");
  }

  if (currentPlan === "elite" || currentPlan === "ultra_elite") {
    features.push("AI usage insights + journaling");
    features.push("90-day encrypted usage history");
    features.push("Smart AI recommendations");
  }

  return {
    included: features,
    excluded: currentPlan === "free" ? ["No AI features"] : [],
  };
}
