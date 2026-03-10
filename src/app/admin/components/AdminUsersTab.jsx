"use client";

import AdminSearchBar from "./AdminSearchBar";

export default function AdminUsersTab({
  users,
  searchTerm,
  setSearchTerm,
  handleSearch,
  handleUserClick,
  handleLoadMoreUsers,
  hasMoreUsers,
  isLoadingMore,
  loadingUserDetails,
}) {
  return (
    <div className="space-y-6">
      <AdminSearchBar
        placeholder="Search users by email, name, or ID..."
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={handleSearch}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Users ({users.length})</h2>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <div
              key={user.id}
              className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${
                loadingUserDetails ? "opacity-50 pointer-events-none" : ""
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
                      {user.profile_name || "No Name"}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.profile_email}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">ID: {user.id}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.plan === "free"
                        ? "bg-gray-100 text-gray-800"
                        : user.plan === "pro"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                    }`}
                  >
                    {user.plan || "free"}
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
  );
}
