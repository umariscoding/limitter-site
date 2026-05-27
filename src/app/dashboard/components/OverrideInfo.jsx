"use client";

import Link from "next/link";
import { formatPlanName } from "../utils";

export default function OverrideInfo({ plan }) {
  if (plan === "free") {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">Free Plan:</span> $1.99 per override.{" "}
        <Link href="/#premium-plans" className="text-primary hover:underline">
          Upgrade
        </Link>{" "}
        for monthly free overrides.
      </p>
    );
  }

  if (plan === "pro") {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">Pro Plan:</span> 15 free overrides per
        month, then purchase more at $1.99 each.
      </p>
    );
  }

  return (
    <p className="text-gray-600 dark:text-gray-400">
      <span className="font-medium">{formatPlanName(plan)} Plan:</span> Unlimited
      overrides included!
    </p>
  );
}
