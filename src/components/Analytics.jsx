"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getUserRecentActivity } from "@/lib/firebase";

export default function Analytics({ onBack, user, subscription, blockedSites, overrideStats, dashboardData, userStats }) {
  // Debug logging to see what data we're getting
  useEffect(() => {
    console.log("📊 Analytics Data:");
    console.log("overrideStats:", overrideStats);
    console.log("subscription:", subscription);
    console.log("blockedSites:", blockedSites);
    console.log("userStats:", userStats);
    console.log("dashboardData:", dashboardData);
  }, [overrideStats, subscription, blockedSites, userStats, dashboardData]);

  // Calculate total spent from different sources
  const getTotalSpent = () => {
    if (overrideStats?.total_spent && typeof overrideStats.total_spent === 'number') {
      return overrideStats.total_spent;
    }
    
    // Fallback: calculate from monthly stats
    if (overrideStats?.monthly_stats) {
      const total = Object.values(overrideStats.monthly_stats).reduce((sum, monthData) => {
        return sum + (monthData.total_spent_this_month || 0);
      }, 0);
      return total;
    }
    
    return 0;
  };

  // Get current overrides count
  const getCurrentOverrides = () => {
    if (subscription?.plan === 'elite') return '∞';
    return overrideStats?.overrides ?? overrideStats?.current_overrides ?? 0;
  };

  // Get total overrides received
  const getTotalOverridesReceived = () => {
    return overrideStats?.total_overrides_purchased ?? 
           overrideStats?.total_received ?? 
           overrideStats?.lifetime_overrides ?? 0;
  };

  // Get total overrides used
  const getTotalOverridesUsed = () => {
    return overrideStats?.overrides_used_total ?? 
           overrideStats?.total_used ?? 
           overrideStats?.lifetime_used ?? 0;
  };

  // Recent Activity Component
  const RecentActivityList = ({ userId }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchActivities = async () => {
        if (!userId) return;
        
        try {
          setLoading(true);
          const recentActivity = await getUserRecentActivity(userId);
          setActivities(recentActivity);
        } catch (error) {
          console.error("Error fetching recent activity:", error);
          setActivities([]);
        } finally {
          setLoading(false);
        }
      };

      fetchActivities();
    }, [userId]);

    const formatTimestamp = (timestamp) => {
      try {
        let date;
        if (timestamp?.seconds) {
          date = new Date(timestamp.seconds * 1000);
        } else if (timestamp?.getTime) {
          date = timestamp;
        } else {
          return 'Recently';
        }
        
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
      } catch (error) {
        return 'Recently';
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                activity.color === 'green' ? 'bg-green-100 dark:bg-green-900/30' :
                activity.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                activity.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                activity.color === 'gray' ? 'bg-gray-100 dark:bg-gray-900/30' :
                'bg-gray-100 dark:bg-gray-900/30'
              }`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">No recent activity</p>
            <p className="text-xs mt-1">Your activity will appear here</p>
          </div>
        )}
      </div>
    );
  };

  // Check if user has access to analytics (Pro+ plans only)
  if (subscription?.plan === 'free') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold">Analytics & Insights</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">Advanced analytics require a paid plan</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
              Free Plan
            </div>
          </div>

          {/* Upgrade Notice */}
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              📊 Advanced Analytics
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Get detailed insights, usage patterns, override history, and productivity analytics with our Pro and Elite plans.
            </p>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-6 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🚀 Unlock with Pro or Elite:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  30-90 day history
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Site-by-site breakdown
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Override history
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Productivity insights
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Export data (Elite)
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI insights (Elite)
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <Link
                href="/pricing"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                View Plans & Pricing
              </Link>
              <button
                onClick={onBack}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-semibold"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold">Analytics & Insights</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Track your usage patterns and productivity</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            subscription?.plan === 'free' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
            subscription?.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
          }`}>
            {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'} Plan
          </div>
        </div>

        {/* Analytics Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-200 dark:bg-blue-700 rounded-lg">
                <svg className="w-4 h-4 text-blue-700 dark:text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {dashboardData?.sites?.total ?? blockedSites?.length ?? 0}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Sites Tracked</div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-200 dark:bg-green-700 rounded-lg">
                <svg className="w-4 h-4 text-green-700 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {userStats?.totalTimeSaved ? Math.floor(userStats.totalTimeSaved / 60) : 0}h
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Time Saved</div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-200 dark:bg-purple-700 rounded-lg">
                <svg className="w-4 h-4 text-purple-700 dark:text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {getCurrentOverrides()}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Overrides Left</div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-200 dark:bg-orange-700 rounded-lg">
                <svg className="w-4 h-4 text-orange-700 dark:text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              ${getTotalSpent().toFixed(2)}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">Total Spent</div>
          </div>
        </div>

        {/* Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sites Access */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Site Access
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {blockedSites?.slice(0, 5).map((site) => (
                <div key={site.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                        {site.name?.charAt(0)?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{site.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{site.url}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {site.last_accessed ? 
                        new Date(site.last_accessed.seconds * 1000).toLocaleDateString() : 
                        'Never'}
                    </p>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {Math.floor((site.time_limit || 1800) / 60)}m limit
                    </p>
                  </div>
                </div>
              ))}
              {(!blockedSites || blockedSites.length === 0) && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-sm">No sites tracked yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recent Activity
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Latest updates</span>
            </div>
            <RecentActivityList userId={user?.uid} />
          </div>

          {/* Override Statistics */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Override Summary
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">All Time</span>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {getTotalOverridesReceived()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Received</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {getTotalOverridesUsed()}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Used</p>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Spent</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  ${getTotalSpent().toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 112-2h2a2 2 0 012 2v1M3 7h18M5 10h14l-1 7H6l-1-7z" />
                </svg>
                Subscription Plan
              </h3>
              {subscription?.plan === 'free' && (
                <Link href="/pricing" className="text-xs text-primary hover:underline">
                  Upgrade
                </Link>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">Current Plan</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {subscription?.status || 'Active'}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  subscription?.plan === 'free' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                  subscription?.plan === 'pro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                }`}>
                  {subscription?.plan ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1) : 'Free'}
                </div>
              </div>
              {subscription?.plan !== 'free' && subscription?.current_period_end && (
                <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">Next Billing</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Auto-renewal
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {new Date(subscription.current_period_end.seconds * 1000).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Site Details Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Site Summary
              </h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Overview</span>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {blockedSites?.filter(site => site.is_active !== false).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Active Sites</p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {blockedSites?.filter(site => site.is_active === false).length || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paused Sites</p>
                </div>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average Time Limit</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {blockedSites?.length > 0 ? 
                    Math.floor(blockedSites.reduce((acc, site) => acc + (site.time_limit || 1800), 0) / blockedSites.length / 60) : 0}m
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 