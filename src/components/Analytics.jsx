"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usageApi, billingApi } from "@/lib/api";
import { formatMinutes, formatPlanName, getPolicyTypeLabel } from "@/app/dashboard/utils";

export default function Analytics({ onBack, user, subscription, policies = [], overrideStats }) {
  const [weeklyUsage, setWeeklyUsage] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loadingUsage, setLoadingUsage] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoadingUsage(true);
      try {
        const [weekly, purchaseData] = await Promise.all([
          usageApi.getWeekly().catch(() => []),
          billingApi.listPurchases(10).catch(() => ({ purchases: [] })),
        ]);
        setWeeklyUsage(Array.isArray(weekly) ? weekly : (weekly?.days || []));
        setPurchases(purchaseData?.purchases || []);
      } catch {
        // ignore
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchData();
  }, []);

  const plan = subscription?.plan || "free";

  if (plan === "free") {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Analytics</h2>
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">Upgrade for Analytics</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Get detailed usage reports, weekly trends, and override statistics with a Pro or Elite plan.
          </p>
          <Link href="/?scrollTo=pricing" className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const totalPolicies = policies.length;
  const avgLimitMinutes = totalPolicies > 0
    ? Math.round(policies.reduce((sum, p) => sum + (p.dailyLimitMinutes || 0), 0) / totalPolicies)
    : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-3 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold">Analytics</h2>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">Active Limits</p>
            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalPolicies}</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <p className="text-sm text-purple-700 dark:text-purple-300">Overrides Left</p>
            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{overrideStats?.overrides_left || 0}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-green-700 dark:text-green-300">Avg. Daily Limit</p>
            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatMinutes(avgLimitMinutes)}</p>
          </div>
        </div>

        {policies.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Limit Summary</h3>
            <div className="space-y-3">
              {policies.map((policy) => {
                const state = policy.state || {};
                const usedMinutes = state.usageTodayMinutes || 0;
                const limitMinutes = policy.dailyLimitMinutes || 1;
                const pct = Math.min(100, Math.round((usedMinutes / limitMinutes) * 100));

                return (
                  <div key={policy.policyId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="font-medium">{policy.targetLabel}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{getPolicyTypeLabel(policy.type)}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatMinutes(usedMinutes)} / {formatMinutes(policy.dailyLimitMinutes)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          pct >= 100 ? 'bg-red-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold mb-4">Override Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold">{overrideStats?.overrides_left || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold">{overrideStats?.monthly_limit || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Monthly Free</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold">{overrideStats?.overrides_used_total || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Used Total</p>
            </div>
            <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-2xl font-bold">{overrideStats?.total_overrides_purchased || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Purchased</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Subscription</h3>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">{formatPlanName(plan)} Plan</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {subscription?.provider === 'stripe' ? 'Billed via Stripe' :
                   subscription?.provider === 'google_play' ? 'Billed via Google Play' :
                   'Free plan'}
                </p>
              </div>
              {subscription?.provider === 'stripe' && (
                <Link href="/checkout?plan=elite" className="text-sm text-primary hover:underline">
                  Manage Plan
                </Link>
              )}
            </div>
          </div>
        </div>

        {purchases.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Recent Purchases</h3>
            <div className="space-y-2">
              {purchases.slice(0, 5).map((p, i) => (
                <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                  <div>
                    <span className="font-medium">{p.productId || 'Purchase'}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      via {p.provider === 'stripe' ? 'Stripe' : 'Google Play'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    p.status === 'applied' || p.status === 'consumed'
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
