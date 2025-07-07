"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminDatabaseEditor from "../../components/AdminDatabaseEditor";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  getUserDetails,
  getUserDetailsWithActivity,
  getUserSites,
  formatActivityTimestamp,
  adminUpdateUserProfile,
  adminGrantOverrides,
  adminChangeUserPlan,
  adminGetAllSites,
  adminSoftDeleteSite,
  adminHardDeleteSite,
  adminUpdateSite,
  adminGetCollection,
  adminUpdateDocument,
  adminDeleteDocument,
  adminCreateDocument,
  adminGetSystemStats,
  adminSearchUsers,
  adminSearchSites,
  checkAdminStatus,
  calculateSiteEfficiency
} from "../../lib/firebase";
import { toast } from 'react-hot-toast';
import AdminSiteModal from "../../components/AdminSiteModal";
import AdminTransactions from "@/components/AdminTransactions";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Admin verification
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data states
  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedSite, setSelectedSite] = useState(null);
  const [collections, setCollections] = useState({});
  
  // Pagination states
  const [lastUserDoc, setLastUserDoc] = useState(null);
  const [lastSiteDoc, setLastSiteDoc] = useState(null);
  const [lastTransactionDoc, setLastTransactionDoc] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreSites, setHasMoreSites] = useState(true);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserSitesModal, setShowUserSitesModal] = useState(false);
  const [userSites, setUserSites] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [selectedSiteForEdit, setSelectedSiteForEdit] = useState(null);
  const [showSiteEditModal, setShowSiteEditModal] = useState(false);
  
  // Form states
  const [grantQuantity, setGrantQuantity] = useState(1);
  const [grantReason, setGrantReason] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isGrantingOverrides, setIsGrantingOverrides] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingSites, setIsLoadingSites] = useState(false);

  // Check admin status
  useEffect(() => {
    const verifyAdmin = async () => {
      if (!loading && user) {
        try {
          const adminStatus = await checkAdminStatus(user.uid);
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            router.push('/dashboard');
          }
        } catch (error) {
          console.error("Error checking admin status:", error);
          router.push('/dashboard');
        }
      } else if (!loading && !user) {
        router.push('/login');
      }
      setAdminLoading(false);
    };

    verifyAdmin();
  }, [user, loading, router]);

  // Load initial data
  useEffect(() => {
    if (isAdmin) {
        loadSystemStats();
      if (activeTab === 'users') {
        loadUsers();
      } else if (activeTab === 'sites') {
        loadSites();
      }
    }
  }, [isAdmin, activeTab]);

  const loadSystemStats = async () => {
    try {
      const stats = await adminGetSystemStats();
      console.log("🔍 System stats loaded:", stats);
      setSystemStats(stats);
    } catch (error) {
      console.error("Error loading system stats:", error);
    }
  };

  const loadUsers = async (isLoadingMore = false) => {
    try {
      setIsLoadingUsers(true);
      const { users: newUsers, lastDoc } = await getAllUsers(isLoadingMore ? lastUserDoc : null, ITEMS_PER_PAGE);
      
      if (newUsers.length < ITEMS_PER_PAGE) {
        setHasMoreUsers(false);
      }
      
      setUsers(prev => isLoadingMore ? [...prev, ...newUsers] : newUsers);
      setLastUserDoc(lastDoc);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingUsers(false);
      setIsLoadingMore(false);
    }
  };

  const loadSites = async (isLoadingMore = false) => {
    try {
      setIsLoadingSites(true);
      const { sites: newSites, lastDoc } = await adminGetAllSites(isLoadingMore ? lastSiteDoc : null, ITEMS_PER_PAGE);
      
      if (newSites.length < ITEMS_PER_PAGE) {
        setHasMoreSites(false);
      }
      
      setSites(prev => isLoadingMore ? [...prev, ...newSites] : newSites);
      setLastSiteDoc(lastDoc);
    } catch (error) {
      console.error("Error loading sites:", error);
    } finally {
      setIsLoadingSites(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreUsers = async () => {
    setIsLoadingMore(true);
    await loadUsers(true);
  };

  const handleLoadMoreSites = async () => {
    setIsLoadingMore(true);
    await loadSites(true);
  };

  const handleUserClick = async (userId) => {
    try {
      setLoadingUserDetails(true);
      console.log("📊 Loading enhanced user details...");
      const userDetails = await getUserDetailsWithActivity(userId);
      console.log("🔍 User details loaded:", userDetails);
      setSelectedUser(userDetails);
      setShowUserModal(true);
    } catch (error) {
      console.error("Error loading user details:", error);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleGrantOverrides = async () => {
    if (!selectedUser || !grantQuantity || grantQuantity < 1) return;
    
    try {
      setIsGrantingOverrides(true);
      await adminGrantOverrides(selectedUser.profile.id, grantQuantity, grantReason || "Admin panel override grant");
      
      setShowGrantModal(false);
      setGrantQuantity(1);
      setGrantReason('');
      
      // Show success toast and refresh page
      toast.success(
        <div>
          <p className="font-semibold">Overrides Granted!</p>
          <p className="text-sm">Added {grantQuantity} override{grantQuantity !== 1 ? 's' : ''} to {selectedUser.profile.profile_name}</p>
        </div>,
        {
          duration: 1500,
        }
      );
      
      // Immediate page refresh
      window.location.reload();
    } catch (error) {
      console.error("Error granting overrides:", error);
      toast.error("Failed to grant overrides. Please try again.");
      setIsGrantingOverrides(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedUser) return;
    
    try {
      setIsChangingPlan(true);
      console.log("🔄 Changing user plan and granting benefits...");
      
      // Get plan details for immediate benefits display
      const planDetails = {
        free: { overrides: 0, name: 'FREE' },
        pro: { overrides: 15, name: 'PRO' },
        elite: { overrides: 100, name: 'ELITE' }
      }[selectedPlan];
      
      await adminChangeUserPlan(selectedUser.profile.id, selectedPlan, "Admin panel plan change");
      
      // Show immediate success message with benefits
      console.log('Plan change successful, plan details:', planDetails);
      
      const benefitsText = planDetails.overrides > 0
        ? `+${planDetails.overrides} overrides granted instantly!`
        : 'Plan features activated!';
      
      setShowPlanModal(false);
      
      // Show success toast and refresh page
      toast.success(
        <div>
          <p className="font-semibold">Plan changed to {planDetails.name}!</p>
          <p className="text-sm">{benefitsText}</p>
        </div>,
        {
          duration: 1500,
        }
      );
      
      // Immediate page refresh
      window.location.reload();
    } catch (error) {
      console.error("Error changing plan:", error);
      toast.error("Failed to change plan. Please try again.");
      setIsChangingPlan(false);
    }
  };

  const handleSoftDeleteSite = async (siteId) => {
    if (!confirm("Are you sure you want to deactivate this site? It will be marked as inactive.")) return;
    
    try {
      await adminSoftDeleteSite(siteId, "Admin panel soft delete");
      loadSites();
      
      // Update user sites list if modal is open
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        setUserSites(updatedSites);
      }
      
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite(null);
        setShowSiteModal(false);
      }
    } catch (error) {
      console.error("Error soft deleting site:", error);
    }
  };

  const handleReactivateSite = async (siteId) => {
    if (!confirm("Are you sure you want to reactivate this site?")) return;
    
    try {
      // Update the site to set is_active back to true
      await adminUpdateSite(siteId, { 
        is_active: true,
        soft_deleted_at: null,
        reactivated_at: new Date(),
        reactivated_by: 'admin'
      });
      
      loadSites();
      
      // Update user sites list if modal is open
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        setUserSites(updatedSites);
      }
      
      console.log("✅ Site reactivated successfully");
    } catch (error) {
      console.error("Error reactivating site:", error);
      alert("Error reactivating site. Please try again.");
    }
  };

  const handleHardDeleteSite = async (siteId) => {
    if (!confirm("Are you sure you want to PERMANENTLY delete this site? This action cannot be undone.")) return;
    
    try {
      await adminHardDeleteSite(siteId, "Admin panel hard delete");
      loadSites();
      
      // Update user sites list if modal is open
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        setUserSites(updatedSites);
      }
      
      if (selectedSite && selectedSite.id === siteId) {
        setSelectedSite(null);
        setShowSiteModal(false);
      }
    } catch (error) {
      console.error("Error hard deleting site:", error);
    }
  };

  const handleViewUserSites = async () => {
    if (!selectedUser) return;
    
    try {
      console.log("Loading user sites...");
      
      // First check if we have the sites in our existing state
      const existingSites = sites.filter(site => site.user_id === selectedUser.profile.id);
      
      if (existingSites.length > 0) {
        console.log("Using sites from existing state...");
        // Get analytics for existing sites
        const sitesWithAnalytics = existingSites.map(site => ({
          ...site,
          analytics: {
            total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
            overrides_used: site.overrides_used || 0
          },
          efficiency: calculateSiteEfficiency(site)
        }));
        setUserSites(sitesWithAnalytics);
        setShowUserSitesModal(true);
        return;
      }
      
      // If not found in state, fetch from Firebase
      console.log("Fetching sites from Firebase...");
      const fetchedSites = await getUserSites(selectedUser.profile.id);
      const sitesWithAnalytics = fetchedSites.map(site => ({
        ...site,
        analytics: {
          total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
          overrides_used: site.overrides_used || 0
        },
        efficiency: calculateSiteEfficiency(site)
      }));
      setUserSites(sitesWithAnalytics);
      setShowUserSitesModal(true);
    } catch (error) {
      console.error("Error loading user sites:", error);
      toast.error("Failed to load user sites");
    }
  };

  // Reset pagination when searching
  const handleSearch = async () => {
    if (searchTerm) {
      if (activeTab === 'users') {
        try {
          const results = await adminSearchUsers(searchTerm, users);
          // If we got back more users than we had (meaning we found a new user), update the full list
          if (results.length > users.length) {
            setUsers(results);
            toast.success("Found and added a new user to the list");
          } else {
            setUsers(results);
          }
          setHasMoreUsers(false);
          setLastUserDoc(null);
        } catch (error) {
          console.error("Error searching users:", error);
          toast.error("Failed to search users");
        }
      } else if (activeTab === 'sites') {
        const results = await adminSearchSites(searchTerm);
        setSites(results);
        setHasMoreSites(false);
        setLastSiteDoc(null);
      }
    } else {
      // Reset and load first page
      if (activeTab === 'users') {
        setHasMoreUsers(true);
        setLastUserDoc(null);
        loadUsers();
      } else if (activeTab === 'sites') {
        setHasMoreSites(true);
        setLastSiteDoc(null);
        loadSites();
      }
    }
  };

  const handleSiteClick = (site) => {
    setSelectedSiteForEdit(site);
    setShowSiteEditModal(true);
  };

  const handleUpdateSite = async (siteId, updateData) => {
    try {
      await adminUpdateSite(siteId, updateData);
      // Refresh the sites list
      loadSites();
    } catch (error) {
      console.error("Error updating site:", error);
      throw error;
    }
  };

  if (loading || adminLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying admin access...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
          {/* Professional Header */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Administration Panel
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      System management and oversight
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 dark:text-green-400 text-sm font-medium">Online</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Navigation */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <nav className="flex border-b border-gray-200 dark:border-gray-700">
                {[
                  { id: 'dashboard', name: 'Dashboard', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
                  { id: 'users', name: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
                  { id: 'sites', name: 'Sites', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9' },
                  { id: 'transactions', name: 'Transactions', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
                  { id: 'database', name: 'Database', icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchTerm('');
                      if (tab.id === 'users' && users.length === 0) loadUsers();
                      if (tab.id === 'sites' && sites.length === 0) loadSites();
                    }}
                    className={`flex items-center gap-3 py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                    </svg>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* System Statistics */}
              {systemStats && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Analytics</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{systemStats?.users?.total || 0}</div>
                          <div className="text-blue-100 text-sm">Total Users</div>
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{systemStats?.sites?.total || 0}</div>
                          <div className="text-green-100 text-sm">Total Sites</div>
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">${(systemStats?.revenue?.total || 0).toFixed(2)}</div>
                          <div className="text-orange-100 text-sm">Total Revenue</div>
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full" style={{width: '90%'}}></div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold">{systemStats?.transactions?.total || 0}</div>
                          <div className="text-purple-100 text-sm">Total Transactions</div>
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div className="bg-white h-2 rounded-full" style={{width: '95%'}}></div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Plan Distribution */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Subscription Distribution
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {!systemStats ? (
                        // Loading state
                        [...Array(3)].map((_, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
                            <div className="text-center">
                              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-200 dark:bg-gray-700"></div>
                              <div className="h-8 w-24 mx-auto bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                              <div className="h-4 w-20 mx-auto bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                          </div>
                        ))
                      ) : !systemStats.users?.byPlan || Object.keys(systemStats.users.byPlan).length === 0 ? (
                        // Empty state
                        <div className="col-span-3 text-center py-8">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Subscription Data</h4>
                          <p className="text-gray-600 dark:text-gray-400">
                            Subscription information will appear here once users start subscribing to plans.
                          </p>
                        </div>
                      ) : (
                        // Default view with data
                        Object.entries(systemStats.users.byPlan).map(([plan, count]) => (
                          <div key={plan} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-700">
                            <div className="text-center">
                              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                                plan === 'free' ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                plan === 'pro' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                'bg-gradient-to-r from-purple-500 to-purple-600'
                              }`}>
                                <span className="text-white font-bold text-xl">{plan.charAt(0).toUpperCase()}</span>
                              </div>
                              <div className="text-3xl font-bold text-gray-900 dark:text-white">{count}</div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize font-medium">{plan} Plan</div>
                              <div className="mt-2 text-xs text-gray-500">
                                {((count / (systemStats?.users?.total || 1)) * 100).toFixed(1)}% of users
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder={activeTab === 'users' ? "Search users by email, name, or ID..." : "Search sites by name, URL, or user ID..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Users List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Users ({users.length})</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                        loadingUserDetails ? 'opacity-50 pointer-events-none' : ''
                      }`}
                      onClick={() => handleUserClick(user.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {loadingUserDetails && (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {user.profile_name || 'No Name'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.profile_email}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              ID: {user.id}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.plan === 'free' ? 'bg-gray-100 text-gray-800' :
                            user.plan === 'pro' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {user.plan || 'free'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreUsers && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLoadMoreUsers}
                      disabled={isLoadingMore}
                      className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sites' && (
            <div className="space-y-6">
              {/* Search */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder={activeTab === 'users' ? "Search users by email, name, or ID..." : "Search sites by name, URL, or user ID..."}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Sites List */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold">Sites ({sites.length})</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => handleSiteClick(site)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {site.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {site.url}
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            User: {site.user_id} | ID: {site.id}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            site.is_active === false
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {site.is_active === false ? 'Inactive' : 'Active'}
                          </span>
                          
                          {/* Show different buttons based on site status */}
                          {site.is_active === false ? (
                            // Inactive sites: only show hard delete and reactivate options
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactivateSite(site.id);
                                }}
                                className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                                title="Reactivate this site"
                              >
                                Reactivate
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHardDeleteSite(site.id);
                                }}
                                className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                title="Permanently delete this site"
                              >
                                Hard Delete
                              </button>
                            </>
                          ) : (
                            // Active sites: show soft delete and hard delete options
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSoftDeleteSite(site.id);
                                }}
                                className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200"
                                title="Deactivate this site"
                              >
                                Soft Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHardDeleteSite(site.id);
                                }}
                                className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                                title="Permanently delete this site"
                              >
                                Hard Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {hasMoreSites && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handleLoadMoreSites}
                      disabled={isLoadingMore}
                      className="w-full py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-600 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                          Loading...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Show More
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && <AdminTransactions />}
          {activeTab === 'database' && <AdminDatabaseEditor />}
        </div>
        </div>

      {/* Modals */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-xl">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">User profile and account management</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[80vh]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* User Profile Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-semibold">
                        {selectedUser.profile?.profile_name?.charAt(0) || selectedUser.profile?.profile_email?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {selectedUser.profile?.profile_name || 'Unnamed User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{selectedUser.profile?.profile_email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Plan:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.profile?.plan === 'free' ? 'bg-gray-200 text-gray-800' :
                          selectedUser.profile?.plan === 'pro' ? 'bg-blue-200 text-blue-800' :
                          'bg-purple-200 text-purple-800'
                        }`}>
                          {selectedUser.profile?.plan?.toUpperCase() || 'FREE'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Admin Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedUser.profile?.isAdmin ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
                        }`}>
                          {selectedUser.profile?.isAdmin ? 'ADMIN' : 'USER'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">User ID:</span>
                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {selectedUser.profile?.id}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Member Since:</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedUser.profile?.created_at ? new Date(selectedUser.profile.created_at.seconds * 1000).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>

                      {/* View Sites Button */}
                      <button
                        onClick={handleViewUserSites}
                        className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        View User Sites
                      </button>
                    </div>
                  </div>

                  {/* Statistics Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Account Statistics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {selectedUser.summary?.totalSites || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Sites</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {selectedUser.summary?.activeSites || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Active Sites</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {selectedUser.summary?.overridesLeft || 0}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Overrides Left</div>
                      </div>
                      
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                          {console.log(selectedUser)}
                          ${selectedUser.profile?.total_spent?.toFixed(2) || '0.00'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity - Dynamic */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Recent Activity
                    </h3>
                    
                    <div className="space-y-3">
                      {selectedUser.recentActivity && selectedUser.recentActivity.length > 0 ? (
                        selectedUser.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                              activity.color === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                              activity.color === 'green' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                              activity.color === 'purple' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' :
                              activity.color === 'gray' ? 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400' :
                              'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400'
                            }`}>
                              <span>{activity.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {activity.description}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {formatActivityTimestamp(activity.timestamp)}
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              activity.color === 'blue' ? 'bg-blue-500' :
                              activity.color === 'green' ? 'bg-green-500' :
                              activity.color === 'purple' ? 'bg-purple-500' :
                              activity.color === 'gray' ? 'bg-gray-500' :
                              'bg-gray-500'
                            }`}></div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            No recent activity found
                          </div>
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            User activity will appear here once they start using the platform
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Actions
                    </h3>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowGrantModal(true)}
                        className="w-full flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors border border-blue-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Grant Overrides
                      </button>
                      
                      <button
                        onClick={() => setShowPlanModal(true)}
                        className="w-full flex items-center gap-3 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Change Plan
                      </button>
                      
                      <button
                        onClick={handleViewUserSites}
                        className="w-full flex items-center gap-3 p-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                        </svg>
                        View Sites
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showGrantModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Grant Overrides</h3>
                    <p className="text-green-100 text-sm">Add override credits to user account</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* User Info */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.profile?.profile_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {selectedUser.profile?.profile_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUser.profile?.profile_email}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Current: {selectedUser.summary?.overridesLeft || 0} overrides
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Quantity Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Override Quantity
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={grantQuantity}
                        onChange={(e) => setGrantQuantity(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                        placeholder="Enter number of overrides"
                      />
                      <div className="absolute right-3 top-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {[1, 5, 10, 25, 50].map(qty => (
                        <button
                          key={qty}
                          onClick={() => setGrantQuantity(qty)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                            grantQuantity === qty
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Reason Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Reason for Grant
                    </label>
                    <div className="relative">
                      <textarea
                        value={grantReason}
                        onChange={(e) => setGrantReason(e.target.value)}
                        placeholder="Enter reason for granting overrides (e.g., Customer support, Promotional, Bug compensation)"
                        rows="3"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                      />
                      <div className="absolute right-3 top-3 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {['Customer Support', 'Promotional Grant', 'Bug Compensation', 'Premium Upgrade'].map(reason => (
                        <button
                          key={reason}
                          onClick={() => setGrantReason(reason)}
                          className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-green-100 dark:hover:bg-green-900 transition-colors duration-200"
                        >
                          {reason}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Grant Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Current Overrides:</span>
                        <span className="font-medium">{selectedUser.summary?.overridesLeft || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Adding:</span>
                        <span className="font-medium text-green-600">+{grantQuantity}</span>
                      </div>
                      <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-900 dark:text-white font-semibold">New Total:</span>
                          <span className="font-bold text-green-600">{(selectedUser.summary?.overridesLeft || 0) + grantQuantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleGrantOverrides}
                    disabled={!grantQuantity || grantQuantity < 1 || isGrantingOverrides}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                  >
                    {isGrantingOverrides ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Granting...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Grant {grantQuantity} Override{grantQuantity !== 1 ? 's' : ''}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowGrantModal(false);
                      setGrantQuantity(1);
                      setGrantReason('');
                    }}
                    disabled={isGrantingOverrides}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPlanModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
              {/* Header - Fixed */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Change Subscription Plan</h3>
                    <p className="text-blue-100 text-sm">Upgrade or modify user&apos;s subscription tier</p>
                  </div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="p-6 overflow-y-auto">
                {/* User Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.profile?.profile_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {selectedUser.profile?.profile_name || 'Unnamed User'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedUser.profile?.profile_email}
                      </div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        Current Plan: {selectedUser.profile?.plan?.toUpperCase() || 'FREE'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select New Plan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'free',
                        name: 'Free',
                        price: '$0',
                        overrides: 0,
                        features: ['1 device', '3 websites/apps', '1-hour fixed lockout', '$1.99 per override'],
                        gradient: 'from-gray-500 to-gray-600',
                        borderColor: 'border-gray-500'
                      },
                      {
                        id: 'pro',
                        name: 'Pro',
                        price: '$4.99',
                        overrides: 15,
                        features: ['3 devices', 'Unlimited tracking', 'Custom lockout', '15 free overrides/month', 'AI nudges', 'Sync + reports'],
                        gradient: 'from-blue-500 to-blue-600',
                        borderColor: 'border-blue-500'
                      },
                      {
                        id: 'elite',
                        name: 'Elite',
                        price: '$11.99',
                        overrides: 100,
                        features: ['10 devices', '100 overrides', 'AI insights', 'Journaling', '90-day history', 'Smart AI recommendations'],
                        gradient: 'from-purple-500 to-purple-600',
                        borderColor: 'border-purple-500'
                      }
                    ].map((plan) => (
                      <div
                        key={plan.id}
                        className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                          selectedPlan === plan.id
                            ? `${plan.borderColor} bg-gray-50 dark:bg-gray-700/50`
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {selectedPlan === plan.id && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        
                        <div className={`w-12 h-12 bg-gradient-to-r ${plan.gradient} rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3`}>
                          {plan.name.charAt(0)}
                        </div>
                        
                        <h5 className="font-bold text-lg text-gray-900 dark:text-white">{plan.name}</h5>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                          {plan.price}<span className="text-sm font-normal text-gray-500">/month</span>
                        </p>
                        
                        {(plan.overrides > 0 || plan.overrides === 'unlimited') && (
                          <div className="mb-3 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">
                              {`+${plan.overrides} overrides granted immediately`
                              }
                            </span>
                          </div>
                        )}
                        
                        <ul className="space-y-2">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <input
                          type="radio"
                          name="plan"
                          value={plan.id}
                          checked={selectedPlan === plan.id}
                          onChange={(e) => setSelectedPlan(e.target.value)}
                          className="sr-only"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan Change Summary */}
                {selectedPlan !== selectedUser.profile?.plan && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Plan Change & Benefits Summary
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Current Plan:</span>
                          <div className="font-medium capitalize">{selectedUser.profile?.plan || 'free'}</div>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">New Plan:</span>
                          <div className="font-medium capitalize text-blue-600">{selectedPlan}</div>
                        </div>
                      </div>
                      
                      {(() => {
                        const planBenefits = {
                          free: { overrides: 0, monthly: 0 },
                          pro: { overrides: 15, monthly: 15 },
                          elite: { overrides: 100, monthly: 100 }
                        };
                        const benefits = planBenefits[selectedPlan] || planBenefits.free;
                        
                        return benefits.overrides > 0 && (
                          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 border border-green-200 dark:border-green-800">
                            <h5 className="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                              Benefits to be granted immediately:
                            </h5>
                            <ul className="space-y-1 text-green-700 dark:text-green-300">
                              <li className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>+{benefits.overrides} override credits (immediate)</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Monthly allocation: {benefits.monthly} overrides</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>Unlimited sites access</span>
                              </li>
                              <li className="flex items-center gap-2">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>All {selectedPlan} plan features</span>
                              </li>
                            </ul>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                {/* Plan Change Modal Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleChangePlan}
                    disabled={selectedPlan === selectedUser.profile?.plan || isChangingPlan}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
                  >
                    {isChangingPlan ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Changing Plan...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Change to {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPlanModal(false);
                      setSelectedPlan(selectedUser.profile?.plan || 'free');
                    }}
                    disabled={isChangingPlan}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Sites Modal */}
        {showUserSitesModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-xl">
              {/* Header */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                    </svg>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Sites for {selectedUser.profile?.profile_name || 'User'}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userSites.length} site{userSites.length !== 1 ? 's' : ''} found
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUserSitesModal(false)}
                    className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {userSites.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Site
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Time Saved
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Overrides Used
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Efficiency
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800">
                        {userSites.map((site, index) => (
                          <tr key={site.id} className={`${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'} hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors`}>
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                                  </svg>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {site.name || site.url}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {site.url}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                site.is_active
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                              }`}>
                                {site.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white">
                              {site.analytics?.total_time_saved_minutes || 0} min
                            </td>
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white">
                              {site.analytics?.overrides_used || 0}
                            </td>
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      site.efficiency >= 80 ? 'bg-green-500' :
                                      site.efficiency >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(site.efficiency, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  {site.efficiency}%
                                </span>
                              </div>
                            </td>
                           
                            <td className="px-4 py-4 border-b border-gray-200 dark:border-gray-600">
                              <div className="flex gap-2">
                                {site.is_active ? (
                                  // Active sites: show soft delete (deactivate) and hard delete
                                  <>
                                    <button
                                      onClick={() => handleSoftDeleteSite(site.id)}
                                      className="p-1 text-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition-colors"
                                      title="Deactivate Site"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleHardDeleteSite(site.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                      title="Permanently Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                ) : (
                                  // Inactive sites: show reactivate and hard delete only
                                  <>
                                    <button
                                      onClick={() => handleReactivateSite(site.id)}
                                      className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
                                      title="Reactivate Site"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleHardDeleteSite(site.id)}
                                      className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                      title="Permanently Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No Sites Found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      This user hasn&apos;t added any blocked sites yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total: {userSites.length} site{userSites.length !== 1 ? 's' : ''}
                  </div>
                  <button
                    onClick={() => setShowUserSitesModal(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Site Edit Modal */}
        <AdminSiteModal
          isOpen={showSiteEditModal}
          onClose={() => setShowSiteEditModal(false)}
          site={selectedSiteForEdit}
          onUpdate={handleUpdateSite}
        />
      <Footer />
    </>
  );
} 