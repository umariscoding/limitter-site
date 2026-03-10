"use client";

export default function AdminGrantModal({
  selectedUser,
  grantQuantity,
  grantReason,
  setGrantQuantity,
  setGrantReason,
  onGrant,
  onClose,
  isGrantingOverrides,
}) {
  if (!selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
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
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser.profile?.profile_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.profile?.profile_name || "Unnamed User"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.profile?.profile_email}</div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Current: {selectedUser.summary?.overridesLeft || 0} overrides
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Override Quantity</label>
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
              </div>
              <div className="mt-2 flex gap-2">
                {[1, 5, 10, 25, 50].map((qty) => (
                  <button
                    key={qty}
                    onClick={() => setGrantQuantity(qty)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors duration-200 ${
                      grantQuantity === qty
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900"
                    }`}
                  >
                    {qty}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Reason for Grant</label>
              <textarea
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                placeholder="Enter reason for granting overrides (e.g., Customer support, Promotional, Bug compensation)"
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
              />
              <div className="mt-2 flex gap-2 flex-wrap">
                {["Customer Support", "Promotional Grant", "Bug Compensation", "Premium Upgrade"].map((reason) => (
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
                    <span className="font-bold text-green-600">
                      {(selectedUser.summary?.overridesLeft || 0) + grantQuantity}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <button
              onClick={onGrant}
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
                  Grant {grantQuantity} Override{grantQuantity !== 1 ? "s" : ""}
                </>
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isGrantingOverrides}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
