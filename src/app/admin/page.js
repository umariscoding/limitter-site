"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminDatabaseEditor from "../../components/AdminDatabaseEditor";
import AdminTransactions from "../../components/AdminTransactions";
import AdminSiteModal from "../../components/AdminSiteModal";
import { PageLoader } from "../../components/common";
import {
  AdminDashboardTab,
  AdminUsersTab,
  AdminSitesTab,
  AdminUserModal,
  AdminGrantModal,
  AdminPlanModal,
  AdminUserSitesModal,
  AdminMessagesTab,
} from "./components";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  getUserDetailsWithActivity,
  getUserSites,
  formatActivityTimestamp,
  adminGrantOverrides,
  adminChangeUserPlan,
  adminGetAllSites,
  adminSoftDeleteSite,
  adminHardDeleteSite,
  adminUpdateSite,
  adminGetSystemStats,
  adminSearchUsers,
  adminSearchSites,
  checkAdminStatus,
  calculateSiteEfficiency,
} from "../../lib/firebase";
import { toast } from "react-hot-toast";

export default function AdminPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  const [systemStats, setSystemStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUserDoc, setLastUserDoc] = useState(null);
  const [lastSiteDoc, setLastSiteDoc] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [hasMoreSites, setHasMoreSites] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const [showUserModal, setShowUserModal] = useState(false);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showUserSitesModal, setShowUserSitesModal] = useState(false);
  const [userSites, setUserSites] = useState([]);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [selectedSiteForEdit, setSelectedSiteForEdit] = useState(null);
  const [showSiteEditModal, setShowSiteEditModal] = useState(false);

  const [grantQuantity, setGrantQuantity] = useState(1);
  const [grantReason, setGrantReason] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [isGrantingOverrides, setIsGrantingOverrides] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!loading && user) {
        try {
          const adminStatus = await checkAdminStatus(user.uid);
          setIsAdmin(adminStatus);
          if (!adminStatus) router.push("/dashboard");
        } catch (error) {
          console.error("Error checking admin status:", error);
          router.push("/dashboard");
        }
      } else if (!loading && !user) {
        router.push("/login");
      }
      setAdminLoading(false);
    };
    verifyAdmin();
  }, [user, loading, router]);

  useEffect(() => {
    if (isAdmin) {
      loadSystemStats();
      if (activeTab === "users") loadUsers();
      else if (activeTab === "sites") loadSites();
    }
  }, [isAdmin, activeTab]);

  const loadSystemStats = async () => {
    try {
      const stats = await adminGetSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error("Error loading system stats:", error);
    }
  };

  const loadUsers = async (isLoadingMore = false) => {
    try {
      const { users: newUsers, lastDoc } = await getAllUsers(
        isLoadingMore ? lastUserDoc : null,
        ITEMS_PER_PAGE
      );
      if (newUsers.length < ITEMS_PER_PAGE) setHasMoreUsers(false);
      setUsers((prev) => (isLoadingMore ? [...prev, ...newUsers] : newUsers));
      setLastUserDoc(lastDoc);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadSites = async (isLoadingMore = false) => {
    try {
      const { sites: newSites, lastDoc } = await adminGetAllSites(
        isLoadingMore ? lastSiteDoc : null,
        ITEMS_PER_PAGE
      );
      if (newSites.length < ITEMS_PER_PAGE) setHasMoreSites(false);
      setSites((prev) => (isLoadingMore ? [...prev, ...newSites] : newSites));
      setLastSiteDoc(lastDoc);
    } catch (error) {
      console.error("Error loading sites:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleLoadMoreUsers = () => {
    setIsLoadingMore(true);
    loadUsers(true);
  };

  const handleLoadMoreSites = () => {
    setIsLoadingMore(true);
    loadSites(true);
  };

  const handleUserClick = async (userId) => {
    try {
      setLoadingUserDetails(true);
      const userDetails = await getUserDetailsWithActivity(userId);
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
      await adminGrantOverrides(
        selectedUser.profile.id,
        grantQuantity,
        grantReason || "Admin panel override grant"
      );
      setShowGrantModal(false);
      setGrantQuantity(1);
      setGrantReason("");
      toast.success(
        <div>
          <p className="font-semibold">Overrides Granted!</p>
          <p className="text-sm">
            Added {grantQuantity} override{grantQuantity !== 1 ? "s" : ""} to {selectedUser.profile.profile_name}
          </p>
        </div>,
        { duration: 1500 }
      );
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
      await adminChangeUserPlan(selectedUser.profile.id, selectedPlan, "Admin panel plan change");
      const planDetails = {
        free: { overrides: 0, name: "FREE" },
        pro: { overrides: 15, name: "PRO" },
        elite: { overrides: 100, name: "ELITE" },
      }[selectedPlan];
      setShowPlanModal(false);
      const benefitsText =
        planDetails.overrides > 0
          ? `+${planDetails.overrides} overrides granted instantly!`
          : "Plan features activated!";
      toast.success(
        <div>
          <p className="font-semibold">Plan changed to {planDetails.name}!</p>
          <p className="text-sm">{benefitsText}</p>
        </div>,
        { duration: 1500 }
      );
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
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        const sitesWithAnalytics = updatedSites.map((site) => ({
          ...site,
          analytics: {
            total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
            overrides_used: site.overrides_used || 0,
          },
          efficiency: calculateSiteEfficiency(site),
        }));
        setUserSites(sitesWithAnalytics);
      }
    } catch (error) {
      console.error("Error soft deleting site:", error);
    }
  };

  const handleReactivateSite = async (siteId) => {
    if (!confirm("Are you sure you want to reactivate this site?")) return;
    try {
      await adminUpdateSite(siteId, {
        is_active: true,
        soft_deleted_at: null,
        reactivated_at: new Date(),
        reactivated_by: "admin",
      });
      loadSites();
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        const sitesWithAnalytics = updatedSites.map((site) => ({
          ...site,
          analytics: {
            total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
            overrides_used: site.overrides_used || 0,
          },
          efficiency: calculateSiteEfficiency(site),
        }));
        setUserSites(sitesWithAnalytics);
      }
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
      if (showUserSitesModal && selectedUser) {
        const updatedSites = await getUserSites(selectedUser.profile.id);
        const sitesWithAnalytics = updatedSites.map((site) => ({
          ...site,
          analytics: {
            total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
            overrides_used: site.overrides_used || 0,
          },
          efficiency: calculateSiteEfficiency(site),
        }));
        setUserSites(sitesWithAnalytics);
      }
    } catch (error) {
      console.error("Error hard deleting site:", error);
    }
  };

  const handleViewUserSites = async () => {
    if (!selectedUser) return;
    try {
      const existingSites = sites.filter((s) => s.user_id === selectedUser.profile.id);
      if (existingSites.length > 0) {
        const sitesWithAnalytics = existingSites.map((site) => ({
          ...site,
          analytics: {
            total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
            overrides_used: site.overrides_used || 0,
          },
          efficiency: calculateSiteEfficiency(site),
        }));
        setUserSites(sitesWithAnalytics);
        setShowUserSitesModal(true);
        return;
      }
      const fetchedSites = await getUserSites(selectedUser.profile.id);
      const sitesWithAnalytics = fetchedSites.map((site) => ({
        ...site,
        analytics: {
          total_time_saved_minutes: Math.round((site.total_time_spent || 0) / 60),
          overrides_used: site.overrides_used || 0,
        },
        efficiency: calculateSiteEfficiency(site),
      }));
      setUserSites(sitesWithAnalytics);
      setShowUserSitesModal(true);
    } catch (error) {
      console.error("Error loading user sites:", error);
      toast.error("Failed to load user sites");
    }
  };

  const handleSearch = async () => {
    if (searchTerm) {
      if (activeTab === "users") {
        try {
          const results = await adminSearchUsers(searchTerm, users);
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
      } else if (activeTab === "sites") {
        const results = await adminSearchSites(searchTerm);
        setSites(results);
        setHasMoreSites(false);
        setLastSiteDoc(null);
      }
    } else {
      if (activeTab === "users") {
        setHasMoreUsers(true);
        setLastUserDoc(null);
        loadUsers();
      } else if (activeTab === "sites") {
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
      loadSites();
    } catch (error) {
      console.error("Error updating site:", error);
      throw error;
    }
  };

  if (loading || adminLoading) {
    return <PageLoader message="Verifying admin access..." />;
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
    { id: "users", name: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    { id: "sites", name: "Sites", icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" },
    { id: "transactions", name: "Transactions", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { id: "messages", name: "Messages", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
    { id: "database", name: "Database", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-6 py-8">
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
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Administration Panel</h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">System management and oversight</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 dark:text-green-400 text-sm font-medium">Online</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <nav className="flex border-b border-gray-200 dark:border-gray-700">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSearchTerm("");
                      if (tab.id === "users" && users.length === 0) loadUsers();
                      if (tab.id === "sites" && sites.length === 0) loadSites();
                    }}
                    className={`flex items-center gap-3 py-4 px-6 font-medium text-sm border-b-2 transition-colors duration-200 ${
                      activeTab === tab.id
                        ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300"
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

          {activeTab === "dashboard" && <AdminDashboardTab systemStats={systemStats} />}
          {activeTab === "users" && (
            <AdminUsersTab
              users={users}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
              handleUserClick={handleUserClick}
              handleLoadMoreUsers={handleLoadMoreUsers}
              hasMoreUsers={hasMoreUsers}
              isLoadingMore={isLoadingMore}
              loadingUserDetails={loadingUserDetails}
            />
          )}
          {activeTab === "sites" && (
            <AdminSitesTab
              sites={sites}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              handleSearch={handleSearch}
              handleSiteClick={handleSiteClick}
              handleLoadMoreSites={handleLoadMoreSites}
              handleSoftDeleteSite={handleSoftDeleteSite}
              handleHardDeleteSite={handleHardDeleteSite}
              handleReactivateSite={handleReactivateSite}
              hasMoreSites={hasMoreSites}
              isLoadingMore={isLoadingMore}
            />
          )}
          {activeTab === "messages" && <AdminMessagesTab />}
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "database" && <AdminDatabaseEditor />}
        </div>
      </div>

      {showUserModal && selectedUser && (
        <AdminUserModal
          selectedUser={selectedUser}
          onClose={() => setShowUserModal(false)}
          onGrantOverrides={() => setShowGrantModal(true)}
          onChangePlan={() => setShowPlanModal(true)}
          onViewUserSites={handleViewUserSites}
          formatActivityTimestamp={formatActivityTimestamp}
        />
      )}

      {showGrantModal && selectedUser && (
        <AdminGrantModal
          selectedUser={selectedUser}
          grantQuantity={grantQuantity}
          grantReason={grantReason}
          setGrantQuantity={setGrantQuantity}
          setGrantReason={setGrantReason}
          onGrant={handleGrantOverrides}
          onClose={() => {
            setShowGrantModal(false);
            setGrantQuantity(1);
            setGrantReason("");
          }}
          isGrantingOverrides={isGrantingOverrides}
        />
      )}

      {showPlanModal && selectedUser && (
        <AdminPlanModal
          selectedUser={selectedUser}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          onChangePlan={handleChangePlan}
          onClose={() => {
            setShowPlanModal(false);
            setSelectedPlan(selectedUser?.profile?.plan || "free");
          }}
          isChangingPlan={isChangingPlan}
        />
      )}

      {showUserSitesModal && selectedUser && (
        <AdminUserSitesModal
          selectedUser={selectedUser}
          userSites={userSites}
          onClose={() => setShowUserSitesModal(false)}
          onSoftDelete={handleSoftDeleteSite}
          onHardDelete={handleHardDeleteSite}
          onReactivate={handleReactivateSite}
        />
      )}

      <AdminSiteModal
        isOpen={showSiteEditModal}
        onClose={() => setShowSiteEditModal(false)}
        site={selectedSiteForEdit}
        onUpdate={handleUpdateSite}
      />
    </>
  );
}
