"use client";

import {
  FaChartBar,
  FaCog,
  FaLock,
  FaPlus,
  FaDollarSign,
} from "react-icons/fa";
import SectionCard from "../../../components/common/SectionCard";
import QuickActionButton from "./QuickActionButton";

export default function QuickActionsCard({
  onAddSite,
  onViewSites,
  onOpenSettings,
  onOpenAnalytics,
  totalSites,
  plan,
}) {
  return (
    <SectionCard title="Quick Actions">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <QuickActionButton
          icon={FaPlus}
          title="Add Site"
          description="Block a new website"
          onClick={onAddSite}
        />
        <QuickActionButton
          icon={FaLock}
          title="Tracking Sites"
          description={`Manage your tracking sites (${totalSites})`}
          onClick={onViewSites}
        />
        <QuickActionButton
          icon={FaCog}
          title="Settings"
          description="Customize your experience"
          onClick={onOpenSettings}
        />
        <QuickActionButton
          icon={FaChartBar}
          title="Analytics"
          description="View insights & usage data"
          onClick={onOpenAnalytics}
        />
        <QuickActionButton
          icon={FaDollarSign}
          title="Buy Overrides"
          description={
            plan === "elite"
              ? "100 free overrides included"
              : "Purchase overrides at $1.99 each"
          }
          href="/checkout?overrides=1"
        />
      </div>
    </SectionCard>
  );
}
