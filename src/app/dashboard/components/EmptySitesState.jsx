"use client";

import { FaLock } from "react-icons/fa";

export default function EmptySitesState({ onAddSite }) {
  return (
    <div className="text-center py-8">
      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
        <FaLock className="w-6 h-6 text-gray-400" />
      </div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-1">
        No tracking sites yet
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Start by adding websites you want to track and limit your time on.
      </p>
      <button
        onClick={onAddSite}
        className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
      >
        Add Your First Site
      </button>
    </div>
  );
}
