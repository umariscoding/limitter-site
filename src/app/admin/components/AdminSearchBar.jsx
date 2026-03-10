"use client";

export default function AdminSearchBar({ placeholder, value, onChange, onSearch }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex gap-4">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Search
        </button>
      </div>
    </div>
  );
}
