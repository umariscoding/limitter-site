"use client";

import SectionCard from "../../../components/common/SectionCard";
import { PLAN_BADGES, formatPlanName } from "../utils";

export default function ProfileCard({ user, subscription, onOpenSettings }) {
  const plan = subscription?.plan || "free";
  const badgeClass = PLAN_BADGES[plan] || PLAN_BADGES.free;

  return (
    <SectionCard title="Profile">
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
              {(user?.profile_name || user?.name || user?.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>
            <p className="font-medium">
              {user?.profile_name || user?.name || "User"}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {user?.profileEmail || user?.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ID: {user?.uid}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Member since
            </p>
            <p className="font-medium">
              {user?.createdAt
                ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                : "Recently"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
            <div
              className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}
            >
              {formatPlanName(plan)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onOpenSettings}
            className="text-sm text-primary hover:underline"
          >
            Settings →
          </button>
        </div>
      </div>
    </SectionCard>
  );
}
