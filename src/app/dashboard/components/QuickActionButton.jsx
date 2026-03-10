"use client";

import Link from "next/link";

export default function QuickActionButton({ icon: Icon, title, description, onClick, href }) {
  const content = (
    <>
      <div className="flex items-center mb-2">
        <Icon className="w-5 h-5 text-primary mr-2" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left block"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
    >
      {content}
    </button>
  );
}
