"use client";

export default function SectionCard({ title, children, action }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {action}
        </div>
        {children}
      </div>
    </div>
  );
}
