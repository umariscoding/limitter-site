"use client";

import Link from "next/link";

export default function OverrideInfo({ plan }) {
  if (plan === "free") {
    return (
      <p className="text-gray-600 dark:text-gray-400">
        <span className="font-medium">Free Plan:</span> Purchase overrides to
        exceed daily limits.{" "}
        <Link href="/pricing" className="text-primary hover:underline">
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
        month, then use purchased overrides or buy more.
      </p>
    );
  }

  return (
    <p className="text-gray-600 dark:text-gray-400">
      <span className="font-medium">Elite Plan:</span> 100 free overrides per
      month!
    </p>
  );
}
