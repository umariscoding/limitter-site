"use client";

import { getPolicyStatus, formatMinutes, getPolicyTypeLabel } from "../utils";

export default function SiteRow({ policy }) {
  const status = getPolicyStatus(policy);
  const state = policy.state || {};

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 ${
        !policy.isActive ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">
          {policy.targetLabel}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {policy.targetKey}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          {getPolicyTypeLabel(policy.type)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}
        >
          {status.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatMinutes(policy.dailyLimitMinutes || 0)}
          {state.usageTodayMinutes > 0 && (
            <span className="ml-1 text-gray-400">
              ({formatMinutes(state.usageTodayMinutes)} used)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
