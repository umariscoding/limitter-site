"use client";

import { getSiteStatus, formatTimeLimit } from "../utils";

export default function SiteRow({ site }) {
  const status = getSiteStatus(site);

  return (
    <div
      className={`flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 ${
        site.is_active === false ? "opacity-60" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 dark:text-white truncate">
          {site.name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
          {site.url}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          ID: {site.id}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={`px-2 py-1 rounded text-xs font-medium ${status.className}`}
        >
          {status.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatTimeLimit(site.time_limit || 1800)}
        </div>
      </div>
    </div>
  );
}
