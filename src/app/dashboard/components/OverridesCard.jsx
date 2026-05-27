"use client";

import Link from "next/link";
import SectionCard from "../../../components/common/SectionCard";
import OverrideMetric from "./OverrideMetric";
import OverrideInfo from "./OverrideInfo";

export default function OverridesCard({ overrideStats, subscription }) {
  if (!overrideStats) return null;

  const isUnlimited = overrideStats.unlimited === true || overrideStats.monthly_limit === -1;

  return (
    <SectionCard
      title="Your Overrides"
      action={
        <Link
          href="/checkout?overrides=1"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
        >
          Buy Overrides
        </Link>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <OverrideMetric
          label="Available Now"
          value={isUnlimited ? "\u221E" : (overrideStats.overrides_left || 0)}
          cardClass="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
          valueClass="text-blue-900 dark:text-blue-100"
        />
        <OverrideMetric
          label="Monthly Allowance"
          value={isUnlimited ? "\u221E" : (overrideStats.monthly_limit || 0)}
          cardClass="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
          valueClass="text-purple-900 dark:text-purple-100"
          subtext="Free per month"
        />
        <OverrideMetric
          label="Total Used"
          value={overrideStats.overrides_used_total || 0}
          cardClass="bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300"
          valueClass="text-gray-900 dark:text-gray-100"
        />
      </div>

      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
        <OverrideInfo plan={subscription?.plan || "free"} />
      </div>
    </SectionCard>
  );
}
