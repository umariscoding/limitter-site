"use client";

export default function StatCard({ icon: Icon, iconWrapClass, iconClass, label, value }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center">
        <div className={`p-2 rounded-lg ${iconWrapClass}`}>
          <Icon className={`w-6 h-6 ${iconClass}`} />
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}
