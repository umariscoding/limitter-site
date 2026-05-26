"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FaChartBar, FaCheckCircle, FaLock, FaBolt } from "react-icons/fa";
import Settings from "../../components/Settings";
import Analytics from "../../components/Analytics";
import SiteManager from "../../components/SiteManager";
import BlockedSitesModal from "../../components/BlockedSitesModal";
import { PageLoader, StatCard, StatusAlert } from "../../components/common";
import {
  ProfileCard,
  SubscriptionCard,
  OverridesCard,
  QuickActionsCard,
  TrackingSitesCard,
} from "./components";
import { useAuth } from "../../context/AuthContext";
import { accountApi, policyApi, overrideApi, billingApi } from "../../lib/api";
import { toast } from "react-hot-toast";
import { getAverageTimeLimit } from "./utils";

export default function Dashboard() {
  const { user, loading, isEmailVerified } = useAuth();
  const router = useRouter();

  const [subscription, setSubscription] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [overrideStats, setOverrideStats] = useState(null);
  const [devices, setDevices] = useState([]);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [activeView, setActiveView] = useState("dashboard");
  const [showSiteManager, setShowSiteManager] = useState(false);
  const [showBlockedSitesModal, setShowBlockedSitesModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [overridePurchaseSuccess, setOverridePurchaseSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const activePolicies = useMemo(() => {
    return policies.filter(p => p.isActive && !p.isArchived);
  }, [policies]);

  const stats = useMemo(() => {
    return {
      totalPolicies: activePolicies.length,
      averageTimeLimit: getAverageTimeLimit(activePolicies),
      activePolicies: activePolicies.filter(p => {
        const state = p.state || {};
        return !state.isExhaustedToday;
      }).length,
    };
  }, [activePolicies]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const [profileData, policiesData, overrideData] = await Promise.all([
        accountApi.getProfile(),
        policyApi.list(tz),
        overrideApi.getBalance().catch(() => null),
      ]);

      const sub = profileData?.subscription || {};
      const account = profileData?.account || {};
      const userProfile = profileData?.user || {};
      setDisplayName(userProfile.displayName || account.name || '');
      setSubscription({
        plan: sub.planCode || account.currentPlanCode || 'free',
        status: sub.status || 'active',
        provider: sub.provider || null,
        autoRenewing: sub.autoRenewing || false,
        expiryTimeMillis: sub.expiryTimeMillis || null,
        stripeCustomerId: sub.stripeCustomerId || null,
        _raw: sub,
      });

      const rawList = Array.isArray(policiesData) ? policiesData : (policiesData?.policies || []);
      const pList = rawList.map((item) => {
        if (item.policy) {
          return {
            ...item.policy,
            state: item.policyState || {},
            nextResetAtMs: item.nextResetAtMs,
          };
        }
        return item;
      });
      setPolicies(pList);

      if (overrideData) {
        const isUnlimited = overrideData.unlimited === true || overrideData.freeOverridesPerMonth === -1;

        setOverrideStats({
          unlimited: isUnlimited,
          overrides_left: isUnlimited ? -1 : (overrideData.totalAvailable || 0),
          monthly_limit: overrideData.freeOverridesPerMonth,
          overrides_used_total: overrideData.totalUsedThisMonth || 0,
          total_overrides_purchased: overrideData.grantedUsed || 0,
        });
      }

      setDevices(profileData?.devices || []);
      setProfileLoaded(true);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setProfileLoaded(true);
    }
  };

  const handlePaymentSuccess = async (sessionId) => {
    if (!user) return;
    try {
      const result = await billingApi.stripeVerifySession(sessionId);
      if (result.subscription) {
        setPaymentSuccess(true);
        toast.success(`Successfully upgraded to ${result.subscription.planCode} plan!`);
      } else if (result.appliedCredits) {
        setOverridePurchaseSuccess(true);
        toast.success(`Successfully purchased ${result.appliedCredits} overrides!`);
      }
      await fetchDashboardData();
      setTimeout(() => {
        setPaymentSuccess(false);
        setOverridePurchaseSuccess(false);
      }, 5000);
    } catch (error) {
      toast.error("Failed to process payment. Please contact support.");
    }
  };

  useEffect(() => {
    if (!loading && !user) { router.push("/login"); return; }
    if (!loading && user && !isEmailVerified) { router.push("/login"); return; }
    if (!user) return;

    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentParam = urlParams.get("payment");
      const sessionId = urlParams.get("session_id");

      if (paymentParam === "success" && sessionId && !isProcessingPayment) {
        setIsProcessingPayment(true);
        const url = new URL(window.location);
        url.searchParams.delete("payment");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url);
        handlePaymentSuccess(sessionId).finally(() => setIsProcessingPayment(false));
      } else if (!profileLoaded && !isProcessingPayment) {
        fetchDashboardData();
      }
    }
  }, [user, loading, isEmailVerified]);

  if (loading) return <PageLoader />;
  if (!user) return null;
  if (!profileLoaded) return <PageLoader message="Loading dashboard..." />;

  const userName = displayName || user?.displayName || '';

  return (
    <>
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back{userName ? `, ${userName}` : ""}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your limits and view your progress
              </p>
            </div>
          </div>

          {paymentSuccess && (
            <StatusAlert
              icon={FaCheckCircle}
              title="Payment Successful!"
              message="Welcome to your premium plan! You now have access to all advanced features."
            />
          )}

          {overridePurchaseSuccess && (
            <StatusAlert
              icon={FaCheckCircle}
              title="Overrides Purchased!"
              message="Your overrides have been added to your account and are ready to use."
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={FaLock}
              iconWrapClass="bg-primary/10"
              iconClass="text-primary"
              label="Active Limits"
              value={stats.totalPolicies}
            />
            <StatCard
              icon={FaBolt}
              iconWrapClass="bg-purple-100 dark:bg-purple-900"
              iconClass="text-purple-600 dark:text-purple-400"
              label="Avg. Daily Limit"
              value={stats.averageTimeLimit}
            />
            <StatCard
              icon={FaChartBar}
              iconWrapClass="bg-blue-100 dark:bg-blue-900"
              iconClass="text-blue-600 dark:text-blue-400"
              label="Not Exhausted"
              value={stats.activePolicies}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ProfileCard
                user={{ ...user, displayName: userName }}
                subscription={subscription}
                onOpenSettings={() => setActiveView("settings")}
              />
            </div>

            <div className="lg:col-span-2 space-y-6">
              {activeView === "settings" ? (
                <Settings onBack={() => setActiveView("dashboard")} />
              ) : activeView === "analytics" ? (
                <Analytics
                  onBack={() => setActiveView("dashboard")}
                  user={user}
                  subscription={subscription}
                  policies={activePolicies}
                  overrideStats={overrideStats}
                />
              ) : (
                <>
                  <SubscriptionCard subscription={subscription} />

                  <OverridesCard
                    overrideStats={overrideStats}
                    subscription={subscription}
                  />

                  <QuickActionsCard
                    onAddSite={() => { setEditingPolicy(null); setShowSiteManager(true); }}
                    onViewSites={() => setShowBlockedSitesModal(true)}
                    onOpenSettings={() => setActiveView("settings")}
                    onOpenAnalytics={() => setActiveView("analytics")}
                    totalSites={activePolicies.length}
                    plan={subscription?.plan || "free"}
                  />

                  <TrackingSitesCard
                    policies={activePolicies}
                    onViewSites={() => setShowBlockedSitesModal(true)}
                    onAddSite={() => { setEditingPolicy(null); setShowSiteManager(true); }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <SiteManager
        isOpen={showSiteManager}
        onClose={() => {
          setShowSiteManager(false);
          setEditingPolicy(null);
          fetchDashboardData();
        }}
        editingPolicy={editingPolicy}
      />

      <BlockedSitesModal
        isOpen={showBlockedSitesModal}
        onClose={() => setShowBlockedSitesModal(false)}
        policies={activePolicies}
        onEditPolicy={(policy) => {
          setShowBlockedSitesModal(false);
          setEditingPolicy(policy);
          setShowSiteManager(true);
        }}
        onRefresh={fetchDashboardData}
      />
    </>
  );
}
