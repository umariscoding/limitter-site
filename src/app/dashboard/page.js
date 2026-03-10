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
  QuickInsights,
  ProfileCard,
  SubscriptionCard,
  OverridesCard,
  QuickActionsCard,
  TrackingSitesCard,
} from "./components";
import { useAuth } from "../../context/AuthContext";
import {
  getUserSubscription,
  getDashboardData,
  getUserOverrideStats,
  updateUserSubscription,
  purchaseOverrides,
} from "../../lib/firebase";
import { toast } from "react-hot-toast";
import { getAverageTimeLimit } from "./utils";

export default function Dashboard() {
  const {
    user,
    userStats,
    blockedSites,
    loading,
    refreshUserData,
    isEmailVerified,
  } = useAuth();

  const router = useRouter();

  const [subscription, setSubscription] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [overrideStats, setOverrideStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [activeView, setActiveView] = useState("dashboard");
  const [showSiteManager, setShowSiteManager] = useState(false);
  const [showBlockedSitesModal, setShowBlockedSitesModal] = useState(false);
  const [editingSiteData, setEditingSiteData] = useState(null);

  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [overridePurchaseSuccess, setOverridePurchaseSuccess] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const stats = useMemo(() => {
    return {
      trackedSites: blockedSites.length,
      averageTimeLimit: getAverageTimeLimit(blockedSites),
      activeSites:
        dashboardData?.stats?.activeSites ?? userStats?.activeSitesBlocked ?? 0,
    };
  }, [blockedSites, dashboardData, userStats]);

  const fetchDashboardData = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);

      const [dashData, subData, overrideData] = await Promise.all([
        getDashboardData(user.uid),
        getUserSubscription(user.uid),
        getUserOverrideStats(user.uid),
      ]);

      setDashboardData(dashData);
      setSubscription(subData);
      setOverrideStats(overrideData);
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (sessionId) => {
    if (!user) return;

    try {
      const response = await fetch("/api/get-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch session details");
      }

      const { session } = await response.json();
      const { paymentType, plan, quantity } = session.metadata;
      const paymentMethod = session.payment_intent?.payment_method;

      const paymentData = {
        cardNumber: paymentMethod?.card?.last4 || "",
        expiryDate: paymentMethod?.card
          ? `${paymentMethod.card.exp_month}/${paymentMethod.card.exp_year}`
          : "",
        nameOnCard: session.customer_details?.name || "",
      };

      if (paymentType === "plan") {
        await updateUserSubscription(user.uid, plan, paymentData);
        setPaymentSuccess(true);
        toast.success(`Successfully upgraded to ${plan} plan!`);
      } else if (paymentType === "overrides") {
        const overrideQty = parseInt(quantity, 10) || 1;
        await purchaseOverrides(user.uid, overrideQty, paymentData);
        setOverridePurchaseSuccess(true);
        toast.success(`Successfully purchased ${overrideQty} overrides!`);
      }

      if (refreshUserData) {
        await refreshUserData();
      }

      setTimeout(() => {
        setPaymentSuccess(false);
        setOverridePurchaseSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("❌ Error processing payment success:", error);
      toast.error("Failed to process payment. Please contact support.");
      throw error;
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (!loading && user && !isEmailVerified) {
      router.push("/login");
      return;
    }

    const processPayment = async (sessionId) => {
      if (isProcessingPayment) return;

      setIsProcessingPayment(true);
      setIsLoading(true);

      try {
        const url = new URL(window.location);
        url.searchParams.delete("payment");
        url.searchParams.delete("session_id");
        window.history.replaceState({}, "", url);

        await handlePaymentSuccess(sessionId);
        await fetchDashboardData();
      } catch (error) {
        console.error("❌ Error processing payment:", error);
        toast.error("Failed to process payment. Please try again.");
      } finally {
        setIsLoading(false);
        setIsProcessingPayment(false);
      }
    };

    const initializeDashboard = async () => {
      if (!user) return;
      setIsLoading(true);
      await fetchDashboardData();
      setIsLoading(false);
    };

    if (typeof window !== "undefined" && user) {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentParam = urlParams.get("payment");
      const sessionId = urlParams.get("session_id");

      if (paymentParam === "success" && sessionId && !isProcessingPayment) {
        processPayment(sessionId);
      } else if (!isProcessingPayment) {
        initializeDashboard();
      }
    }
  }, [user, loading, router, isEmailVerified, isProcessingPayment]);

  const handleAddSiteClick = () => {
    setEditingSiteData(null);
    setShowSiteManager(true);
  };

  const handleEditSite = (site) => {
    setEditingSiteData(site);
    setShowSiteManager(true);
  };

  if (loading || (isLoading && user)) {
    return <PageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back
                {user?.profile_name ? `, ${user.profile_name}` : ""}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your Limitter settings and view your progress
              </p>
            </div>
          </div>

          {paymentSuccess && (
            <StatusAlert
              icon={FaCheckCircle}
              title="Payment Successful! 🎉"
              message="Welcome to your premium plan! You now have access to all advanced features."
            />
          )}

          {overridePurchaseSuccess && (
            <StatusAlert
              icon={FaCheckCircle}
              title="Overrides Purchased! 🎉"
              message="Your overrides have been added to your account and are ready to use."
            />
          )}

          <QuickInsights
            insights={dashboardData?.insights}
            lastUpdated={dashboardData?.lastUpdated}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              icon={FaLock}
              iconWrapClass="bg-primary/10"
              iconClass="text-primary"
              label="Sites Tracking"
              value={stats.trackedSites}
            />
            <StatCard
              icon={FaBolt}
              iconWrapClass="bg-purple-100 dark:bg-purple-900"
              iconClass="text-purple-600 dark:text-purple-400"
              label="Average Time Limit"
              value={stats.averageTimeLimit}
            />
            <StatCard
              icon={FaChartBar}
              iconWrapClass="bg-blue-100 dark:bg-blue-900"
              iconClass="text-blue-600 dark:text-blue-400"
              label="Active Sites"
              value={stats.activeSites}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <ProfileCard
                user={user}
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
                  blockedSites={blockedSites}
                  overrideStats={overrideStats}
                  dashboardData={dashboardData}
                />
              ) : (
                <>
                  <SubscriptionCard subscription={subscription} />

                  <OverridesCard
                    overrideStats={overrideStats}
                    subscription={subscription}
                  />

                  <QuickActionsCard
                    onAddSite={handleAddSiteClick}
                    onViewSites={() => setShowBlockedSitesModal(true)}
                    onOpenSettings={() => setActiveView("settings")}
                    onOpenAnalytics={() => setActiveView("analytics")}
                    totalSites={
                      dashboardData?.sites?.total ?? blockedSites.length
                    }
                    plan={subscription?.plan || "free"}
                  />

                  <TrackingSitesCard
                    blockedSites={blockedSites}
                    dashboardData={dashboardData}
                    onViewSites={() => setShowBlockedSitesModal(true)}
                    onAddSite={handleAddSiteClick}
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
          setEditingSiteData(null);
        }}
        editingSiteData={editingSiteData}
      />

      <BlockedSitesModal
        isOpen={showBlockedSitesModal}
        onClose={() => setShowBlockedSitesModal(false)}
        onEditSite={handleEditSite}
      />
    </>
  );
}
