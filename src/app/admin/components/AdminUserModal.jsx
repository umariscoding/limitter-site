"use client";

export default function AdminUserModal({
  selectedUser,
  onClose,
  onGrantOverrides,
  onChangePlan,
  onViewUserSites,
  formatActivityTimestamp,
}) {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-xl">
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
            <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xl font-semibold">
                  {selectedUser.profile?.profile_name?.charAt(0) ||
                    selectedUser.profile?.profile_email?.charAt(0) ||
                    "U"}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedUser.profile?.profile_name || "Unnamed User"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedUser.profile?.profile_email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Plan:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedUser.profile?.plan === "free"
                        ? "bg-gray-200 text-gray-800"
                        : selectedUser.profile?.plan === "pro"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-purple-200 text-purple-800"
                    }`}
                  >
                    {selectedUser.profile?.plan?.toUpperCase() || "FREE"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Admin Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedUser.profile?.isAdmin ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"
                    }`}
                  >
                    {selectedUser.profile?.isAdmin ? "ADMIN" : "USER"}
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
                    {selectedUser.profile?.created_at
                      ? new Date(selectedUser.profile.created_at.seconds * 1000).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>

                <button
                  onClick={onViewUserSites}
                  className="mt-4 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                  View User Sites
                </button>
              </div>
            </div>

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
                    ${selectedUser.profile?.total_spent?.toFixed(2) || "0.00"}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Spent</div>
                </div>
              </div>
            </div>

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
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                          activity.color === "blue"
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : activity.color === "green"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                              : activity.color === "purple"
                                ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400"
                        }`}
                      >
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
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.color === "blue"
                            ? "bg-blue-500"
                            : activity.color === "green"
                              ? "bg-green-500"
                              : activity.color === "purple"
                                ? "bg-purple-500"
                                : "bg-gray-500"
                        }`}
                      ></div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">No recent activity found</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      User activity will appear here once they start using the platform
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={onGrantOverrides}
                  className="w-full flex items-center gap-3 p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors border border-blue-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Grant Overrides
                </button>
                <button
                  onClick={onChangePlan}
                  className="w-full flex items-center gap-3 p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Change Plan
                </button>
                <button
                  onClick={onViewUserSites}
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
  );
}
