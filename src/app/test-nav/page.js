"use client";

import { useRouter } from "next/navigation";

export default function TestNav() {
  const router = useRouter();

  const testNavigations = [
    { name: "Home", path: "/" },
    { name: "Login", path: "/login" },
    { name: "Signup", path: "/signup" },
    { name: "Dashboard", path: "/dashboard" },
  ];

  const handleNavigation = (path) => {
    console.log("🧪 Test: Navigating to:", path);
    router.push(path);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-8">Navigation Test Page</h1>
      <div className="space-y-4">
        {testNavigations.map((nav) => (
          <button
            key={nav.path}
            onClick={() => handleNavigation(nav.path)}
            className="block w-full max-w-xs bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Go to {nav.name}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <p className="text-gray-600">
          This is a simple test page to check if Next.js routing works properly.
          Check the browser console for navigation logs.
        </p>
      </div>
    </div>
  );
} 