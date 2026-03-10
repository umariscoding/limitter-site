export const PLAN_BADGES = {
  free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  elite:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export function formatPlanName(plan) {
  if (!plan) return "Free";
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

export function formatTimeLimit(totalSeconds = 1800) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${seconds}s`;
}

export function getAverageTimeLimit(blockedSites = []) {
  const activeSites = blockedSites.filter((site) => site.is_active !== false);

  if (!activeSites.length) return "0m";

  const totalLimit = activeSites.reduce(
    (sum, site) => sum + (site.time_limit || 1800),
    0,
  );

  return formatTimeLimit(Math.floor(totalLimit / activeSites.length));
}

export function getSiteStatus(site) {
  if (site.time_remaining === 0 || site.is_blocked) {
    return {
      label: "Blocked",
      className: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400",
    };
  }

  if (site.is_active !== false) {
    return {
      label: "Active",
      className:
        "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400",
    };
  }

  return {
    label: "Inactive",
    className: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  };
}

export function getSubscriptionFeatures(plan) {
  const currentPlan = plan || "free";

  const features = [
    "Smart website blocking",
    currentPlan === "free"
      ? "1 device, track 3 websites/apps"
      : currentPlan === "pro"
        ? "Up to 3 devices"
        : "Up to 10 devices",
    currentPlan === "free"
      ? "1-hour fixed lockout"
      : "Custom lockout durations",
    currentPlan === "free"
      ? "$1.99 per override"
      : currentPlan === "pro"
        ? "15 free overrides/month"
        : "100 free overrides/month",
  ];

  if (currentPlan === "pro" || currentPlan === "elite") {
    features.push("AI nudges & unlimited time tracking");
    features.push("Sync + basic reports");
  }

  if (currentPlan === "elite") {
    features.push("AI usage insights & journaling");
    features.push("90-day encrypted usage history");
    features.push("Smart AI recommendations");
  }

  return {
    included: features,
    excluded: currentPlan === "free" ? ["No AI features"] : [],
  };
}
