"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId?: string | null;
}

interface TopBarProps {
  user: User;
}

/**
 * Top Bar Component
 *
 * Shows user info and sign out button at the top of the admin panel.
 */

export function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setSigningOut(false);
    }
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">
              {user.role.replace("_", " ")}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </header>
  );
}
