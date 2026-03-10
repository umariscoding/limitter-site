"use client";

import SectionCard from "../../../components/common/SectionCard";
import EmptySitesState from "./EmptySitesState";
import SiteRow from "./SiteRow";

export default function TrackingSitesCard({
  blockedSites,
  dashboardData,
  onViewSites,
  onAddSite,
}) {
  const hasNoSites =
    dashboardData?.sites?.hasData === false || blockedSites.length === 0;

  return (
    <SectionCard
      title="Your Tracking Sites"
      action={
        <button
          onClick={onViewSites}
          className="text-sm text-primary hover:underline font-medium"
        >
          View All ({blockedSites.length}) →
        </button>
      }
    >
      {hasNoSites ? (
        <EmptySitesState onAddSite={onAddSite} />
      ) : (
        <div className="space-y-3">
          {blockedSites.slice(0, 4).map((site) => (
            <SiteRow key={site.id} site={site} />
          ))}

          {blockedSites.length > 4 && (
            <div className="pt-2">
              <button
                onClick={onViewSites}
                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
              >
                View {blockedSites.length - 4} more sites →
              </button>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
