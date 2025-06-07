"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Settings from "../../components/Settings";
import SiteManager from "../../components/SiteManager";
import BlockedSitesModal from "../../components/BlockedSitesModal";
import { useAuth } from "../../context/AuthContext";
import { getUserSubscription, getDashboardData } from "../../lib/firebase";

export default function Dashboard() {
  const { user, userStats, blockedSites, loading, logout, refreshUserData } = useAuth();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showSiteManager, setShowSiteManager] = useState(false);
  const [showBlockedSitesModal, setShowBlockedSitesModal] = useState(false);
  const [editingSiteData, setEditingSiteData] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    // Check for payment success from URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentParam = urlParams.get("payment");
      if (paymentParam === "success") {
        setPaymentSuccess(true);
        // Clear the URL parameter after showing the message
        const url = new URL(window.location);
        url.searchParams.delete("payment");
        window.history.replaceState({}, "", url);
        
        // Hide the message after 5 seconds
        setTimeout(() => setPaymentSuccess(false), 5000);
      }
    }

    // Only redirect if we're not loading and definitely have no user
    if (!loading && !user) {
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    // Fetch all dashboard data if user exists
    const fetchDashboardData = async () => {
      if (user?.uid) {
        try {
          console.log("📊 Loading dashboard data...");
          
          // Fetch enhanced dashboard data and subscription in parallel
          const [dashData, subData] = await Promise.all([
            getDashboardData(user.uid),
            getUserSubscription(user.uid)
          ]);
          
          console.log("📈 Dashboard data loaded:", dashData);
          
          setDashboardData(dashData);
          setSubscription(subData);
          
        } catch (error) {
          console.error("❌ Error fetching dashboard data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    if (user) {
      fetchDashboardData();
    } else if (!loading) {
      setIsLoading(false);
    }
  }, [user, loading, router]);

  const handleSettingsClick = () => {
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  const handleAddSiteClick = () => {
    setEditingSiteData(null);
    setShowSiteManager(true);
  };

  const handleViewSitesClick = () => {
    setShowBlockedSitesModal(true);
  };

  const handleCloseSiteManager = () => {
    setShowSiteManager(false);
    setEditingSiteData(null);
  };

  const handleCloseBlockedSitesModal = () => {
    setShowBlockedSitesModal(false);
  };

  const handleEditSite = (site) => {
    setEditingSiteData(site);
    setShowSiteManager(true);
  };

  // Show loading state
  if (loading || (isLoading && user)) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // If no user after loading, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  const getPlanBadge = (plan) => {
    const badges = {
      free: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      pro: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      elite: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
    };
    
    return badges[plan] || badges.free;
  };

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.profileName || user?.name || user?.email}!</h1>
              <p className="text-gray-600 dark:text-gray-400">Manage your Limiter settings and view your progress</p>
            </div>
          </div>

          {/* Payment Success Message */}
          {paymentSuccess && (
            <div className="mb-8 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Payment Successful! 🎉</h3>
                  <p className="text-green-700 dark:text-green-300">
                    Welcome to your premium plan! You now have access to all advanced features.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Stats Summary */}
          {dashboardData?.insights && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200">Quick Insights</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {dashboardData.insights.recentActivity > 0 ? 
                      `${dashboardData.insights.recentActivity} sites accessed this week` : 
                      'No recent activity detected'}
                    {dashboardData.insights.averagePerSite > 0 && 
                      ` • Average ${dashboardData.insights.averagePerSite}m per site`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Last updated: {dashboardData.lastUpdated ? 
                      new Date(dashboardData.lastUpdated).toLocaleTimeString() : 'Now'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sites Tracking</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.stats?.sitesBlocked ?? userStats?.totalSitesBlocked ?? blockedSites?.length ?? 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Time Saved</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.stats?.timeSaved ? `${dashboardData.stats.timeSaved}h` : 
                     userStats?.totalTimeSaved ? `${Math.round(userStats.totalTimeSaved / 60 * 10) / 10}h` : '0h'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Sites</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.stats?.activeSites ?? userStats?.activeSitesBlocked ?? 0}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Today's Time</p>
                  <p className="text-2xl font-bold">
                    {dashboardData?.stats?.todayTime ? `${dashboardData.stats.todayTime}m` : 
                     userStats?.todayTimeSpent ? `${Math.round(userStats.todayTimeSpent)}m` : '0m'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Profile</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      {user?.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt="Profile" 
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                          {(user?.profileName || user?.name || user?.email)?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user?.profileName || user?.name || 'User'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{user?.profileEmail || user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Member since</p>
                        <p className="font-medium">
                          {user?.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
                        <div className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlanBadge(subscription?.plan || 'free')}`}>
                          {subscription?.plan ? (
                            subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
                          ) : 'Free'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      <button 
                        onClick={handleSettingsClick}
                        className="text-sm text-primary hover:underline"
                      >
                        Settings →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main Content Area - Conditional rendering */}
            <div className="lg:col-span-2 space-y-6">
              {showSettings ? (
                <Settings onBack={handleBackFromSettings} />
              ) : (
                <>
                  {/* Subscription Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Your Subscription</h2>
                      
                      {subscription?.plan === 'free' && (
                        <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-lg mb-6">
                          <h3 className="font-semibold mb-2">🚀 Upgrade to unlock more features</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Get unlimited tracking, multiple devices, and AI features with Pro or Elite plans.
                          </p>
                          <Link
                            href="/pricing"
                            className="inline-flex px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
                          >
                            View Plans
                          </Link>
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <h3 className="font-medium">Current plan features:</h3>
                        <ul className="space-y-2">
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">Smart website blocking</span>
                          </li>
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">
                              {subscription?.plan === 'free' || !subscription?.plan ? '1 device, track 3 websites/apps' : 
                               subscription?.plan === 'pro' ? 'Up to 3 devices' : 'Up to 10 devices'}
                            </span>
                          </li>
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">
                              {subscription?.plan === 'free' || !subscription?.plan ? '1-hour fixed lockout' : 
                               subscription?.plan === 'pro' || subscription?.plan === 'elite' ? 'Custom lockout durations' : '1-hour fixed lockout'}
                            </span>
                          </li>
                          <li className="flex items-center">
                            <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm">
                              {subscription?.plan === 'free' || !subscription?.plan ? '$1.99 per override' : 
                               subscription?.plan === 'pro' ? '15 free overrides/month' : 'Unlimited overrides'}
                            </span>
                          </li>
                          {(subscription?.plan === 'pro' || subscription?.plan === 'elite') && (
                            <>
                              <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm">AI nudges & unlimited time tracking</span>
                              </li>
                              <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm">Sync + basic reports</span>
                              </li>
                            </>
                          )}
                          {subscription?.plan === 'elite' && (
                            <>
                              <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm">AI usage insights & journaling</span>
                              </li>
                              <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm">90-day encrypted usage history</span>
                              </li>
                              <li className="flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-sm">Smart AI recommendations</span>
                              </li>
                            </>
                          )}
                          {(subscription?.plan === 'free' || !subscription?.plan) && (
                            <li className="flex items-center">
                              <svg className="h-5 w-5 text-gray mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                              </svg>
                              <span className="text-sm text-gray">No AI features</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={handleAddSiteClick}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <span className="font-medium">Add Site</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Block a new website</p>
                        </button>
                        
                        <button 
                          onClick={handleViewSitesClick}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-medium">Tracking Sites</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Manage your tracking sites ({dashboardData?.sites?.total ?? blockedSites.length})
                          </p>
                        </button>
                        

                        
                        <button 
                          onClick={handleSettingsClick}
                          className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                        >
                          <div className="flex items-center mb-2">
                            <svg className="w-5 h-5 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Settings</span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Customize your experience</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Blocked Sites Preview */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">Your Tracking Sites</h2>
                        <button
                          onClick={handleViewSitesClick}
                          className="text-sm text-primary hover:underline font-medium"
                        >
                          {
                            console.log(blockedSites)
                          }
                          View All ({dashboardData?.sites?.total ?? blockedSites.length}) →
                        </button>
                      </div>
                      
                      {(dashboardData?.sites?.hasData === false || blockedSites.length === 0) ? (
                        <div className="text-center py-8">
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1">No tracking sites yet</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Start by adding websites you want to track and limit your time on.
                          </p>
                          <button
                            onClick={handleAddSiteClick}
                            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
                          >
                            Add Your First Site
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {blockedSites.slice(0, 4).map((site) => (
                            <div key={site.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                      {site.name}
                                    </h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                      {site.url}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                                      site.isActive !== false
                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {site.isActive !== false ? 'Active' : 'Inactive'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {(() => {
                                        const totalSeconds = site.time_limit || 1800; // Default 30 minutes
                                        const hours = Math.floor(totalSeconds / 3600);
                                        const minutes = Math.floor((totalSeconds % 3600) / 60);
                                        const seconds = totalSeconds % 60;
                                        
                                        if (hours > 0) {
                                          return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
                                        } else if (minutes > 0) {
                                          return `${minutes}m`;
                                        } else {
                                          return `${seconds}s`;
                                        }
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {blockedSites.length > 4 && (
                            <div className="pt-2">
                              <button
                                onClick={handleViewSitesClick}
                                className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors text-sm font-medium"
                              >
                                View {blockedSites.length - 4} more sites →
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Site Manager Modal */}
      <SiteManager 
        isOpen={showSiteManager}
        onClose={handleCloseSiteManager}
        editingSiteData={editingSiteData}
      />
      
      {/* Tracking Sites Modal */}
      <BlockedSitesModal 
        isOpen={showBlockedSitesModal}
        onClose={handleCloseBlockedSitesModal}
        onEditSite={handleEditSite}
      />
      
      <Footer />
    </>
  );
} 