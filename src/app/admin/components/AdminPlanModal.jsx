"use client";

const PLAN_OPTIONS = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    overrides: 0,
    features: ["1 device", "3 websites/apps", "1-hour fixed lockout", "$1.99 per override"],
    gradient: "from-gray-500 to-gray-600",
    borderColor: "border-gray-500",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$4.99",
    overrides: 15,
    features: ["3 devices", "Unlimited tracking", "Custom lockout", "15 free overrides/month", "AI nudges", "Sync + reports"],
    gradient: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500",
  },
  {
    id: "elite",
    name: "Elite",
    price: "$11.99",
    overrides: 100,
    features: ["10 devices", "100 overrides", "AI insights", "Journaling", "90-day history", "Smart AI recommendations"],
    gradient: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500",
  },
];

const PLAN_BENEFITS = {
  free: { overrides: 0, monthly: 0 },
  pro: { overrides: 15, monthly: 15 },
  elite: { overrides: 100, monthly: 100 },
};

export default function AdminPlanModal({
  selectedUser,
  selectedPlan,
  setSelectedPlan,
  onChangePlan,
  onClose,
  isChangingPlan,
}) {
  if (!selectedUser) return null;

  const benefits = PLAN_BENEFITS[selectedPlan] || PLAN_BENEFITS.free;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[90vh]">
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

        <div className="p-6 overflow-y-auto">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser.profile?.profile_name?.charAt(0) || "U"}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {selectedUser.profile?.profile_name || "Unnamed User"}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{selectedUser.profile?.profile_email}</div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Current Plan: {selectedUser.profile?.plan?.toUpperCase() || "FREE"}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select New Plan</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLAN_OPTIONS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                    selectedPlan === plan.id
                      ? `${plan.borderColor} bg-gray-50 dark:bg-gray-700/50`
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
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
                    {plan.price}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </p>
                  {plan.overrides > 0 && (
                    <div className="mb-3 px-2 py-1 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs font-medium text-green-700 dark:text-green-400">
                        +{plan.overrides} overrides granted immediately
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
                    <div className="font-medium capitalize">{selectedUser.profile?.plan || "free"}</div>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">New Plan:</span>
                    <div className="font-medium capitalize text-blue-600">{selectedPlan}</div>
                  </div>
                </div>

                {benefits.overrides > 0 && (
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
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3">
            <button
              onClick={onChangePlan}
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
              onClick={onClose}
              disabled={isChangingPlan}
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
