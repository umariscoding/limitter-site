"use client";

import SectionCard from "../../../components/common/SectionCard";
import EmptySitesState from "./EmptySitesState";
import SiteRow from "./SiteRow";

export default function TrackingSitesCard({
  policies = [],
  onViewSites,
  onAddSite,
}) {
  const websites = policies.filter(p => p.type === "website");
  const apps = policies.filter(p => p.type === "app");
  const categories = policies.filter(p => p.type === "category");

  return (
    <SectionCard
      title="Your Limits"
      action={
        <button
          onClick={onViewSites}
          className="text-sm text-primary hover:underline font-medium"
        >
          View All ({policies.length}) →
        </button>
      }
    >
      {policies.length === 0 ? (
        <EmptySitesState onAddSite={onAddSite} />
      ) : (
        <div className="space-y-4">
          {websites.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Websites ({websites.length})
              </h4>
              <div className="space-y-2">
                {websites.slice(0, 3).map((policy) => (
                  <SiteRow key={policy.policyId} policy={policy} />
                ))}
                {websites.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{websites.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {apps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Apps ({apps.length})
              </h4>
              <div className="space-y-2">
                {apps.slice(0, 3).map((policy) => (
                  <SiteRow key={policy.policyId} policy={policy} />
                ))}
                {apps.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{apps.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {categories.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Categories ({categories.length})
              </h4>
              <div className="space-y-2">
                {categories.slice(0, 3).map((policy) => (
                  <SiteRow key={policy.policyId} policy={policy} />
                ))}
                {categories.length > 3 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">
                    +{categories.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}

          {policies.length > 6 && (
            <button
              onClick={onViewSites}
              className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
            >
              View all {policies.length} limits →
            </button>
          )}
        </div>
      )}
    </SectionCard>
  );
}
