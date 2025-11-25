"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

/**
 * Top Bar Component
 * 
 * Shows user info and sign out button at the top of the admin panel.
 */

export function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get user from sessionStorage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleSignOut = () => {
    sessionStorage.removeItem("user");
    router.push("/login");
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role.replace("_", " ")}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}


