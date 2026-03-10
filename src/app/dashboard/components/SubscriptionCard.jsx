"use client";

import Link from "next/link";
import SectionCard from "../../../components/common/SectionCard";
import { getSubscriptionFeatures } from "../utils";
import FeatureList from "./FeatureList";

export default function SubscriptionCard({ subscription }) {
  const plan = subscription?.plan || "free";
  const featureData = getSubscriptionFeatures(plan);

  return (
    <SectionCard title="Your Subscription">
      {plan === "free" && (
        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">
            Upgrade to unlock more features
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get unlimited tracking, multiple devices, and AI features with Pro
            or Elite plans.
          </p>
          <Link
            href="/#pricing"
            className="inline-flex px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
          >
            View Plans
          </Link>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="font-medium">Current plan features:</h3>
        <FeatureList
          features={featureData.included}
          excluded={featureData.excluded}
        />
      </div>
    </SectionCard>
  );
}
