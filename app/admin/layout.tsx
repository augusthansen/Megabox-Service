"use client";

import { AdminSidebar } from "@/components/admin/sidebar";
import { TopBar } from "@/components/admin/top-bar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Admin Layout
 * 
 * This layout wraps all admin pages with:
 * - Sidebar navigation
 * - Top bar with user info
 * - Main content area
 * - Authentication check
 */

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    
    if (!userData) {
      // Not logged in, redirect to login
      router.push("/login");
    } else {
      // User is logged in
      setUser(JSON.parse(userData));
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

