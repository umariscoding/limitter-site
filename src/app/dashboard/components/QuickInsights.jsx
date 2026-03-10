"use client";

export default function QuickInsights({ insights, lastUpdated }) {
  if (!insights) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-blue-800 dark:text-blue-200">
            Quick Insights
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {insights.recentActivity > 0
              ? `${insights.recentActivity} sites accessed this week`
              : "No recent activity detected"}
            {insights.averagePerSite > 0 &&
              ` • Average ${insights.averagePerSite}m per site`}
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Last updated:{" "}
            {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "Now"}
          </p>
        </div>
      </div>
    </div>
  );
}
