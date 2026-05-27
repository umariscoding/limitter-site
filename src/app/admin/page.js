"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminTransactions from "../../components/AdminTransactions";
import { PageLoader } from "../../components/common";
import {
  AdminDashboardTab,
  AdminUsersTab,
  AdminUserModal,
  AdminContactTab,
} from "./components";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  getUserDetailsWithActivity,
  formatActivityTimestamp,
  adminGetSystemStats,
  adminSearchUsers,
  checkAdminStatus,
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
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastUserDoc, setLastUserDoc] = useState(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;

  const [showUserModal, setShowUserModal] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);

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

  const handleLoadMoreUsers = () => {
    setIsLoadingMore(true);
    loadUsers(true);
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

  const handleSearch = async () => {
    if (searchTerm) {
      if (activeTab === "users") {
        try {
          const results = await adminSearchUsers(searchTerm);
          setUsers(results);
          setHasMoreUsers(false);
          setLastUserDoc(null);
        } catch (error) {
          console.error("Error searching users:", error);
          toast.error("Failed to search users");
        }
      }
    } else {
      if (activeTab === "users") {
        setHasMoreUsers(true);
        setLastUserDoc(null);
        loadUsers();
      }
    }
  };

  if (loading || adminLoading) {
    return <PageLoader message="Verifying admin access..." />;
  }

  if (!isAdmin) return null;

  const tabs = [
    { id: "dashboard", name: "Dashboard", icon: "M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" },
    { id: "users", name: "Users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" },
    { id: "transactions", name: "Transactions", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
    { id: "contact", name: "Contact", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
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
          {activeTab === "transactions" && <AdminTransactions />}
          {activeTab === "contact" && <AdminContactTab />}
        </div>
      </div>

      {showUserModal && selectedUser && (
        <AdminUserModal
          selectedUser={selectedUser}
          onClose={() => setShowUserModal(false)}
          formatActivityTimestamp={formatActivityTimestamp}
        />
      )}
    </>
  );
}
