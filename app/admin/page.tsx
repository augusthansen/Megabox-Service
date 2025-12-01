"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Admin Dashboard Page
 *
 * This is the main dashboard page for admins.
 * Shows overview and quick stats.
 */

interface Stats {
  customers: number;
  sites: number;
  machines: number;
  openTickets: number;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    sites: 0,
    machines: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user from session API
    fetchUser();
    // Fetch stats
    fetchStats();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h2>
      
      {/* Welcome Card */}
      {user && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">Welcome back, {user.name || "Admin"}!</h3>
          <p className="text-gray-600">
            You&apos;re logged in as <strong>{user.email}</strong> with role: <strong className="capitalize">{user.role?.replace("_", " ") || "admin"}</strong>
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🏢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Customers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : stats.customers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">📍</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sites</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : stats.sites}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">⚙️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Machines</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : stats.machines}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-3xl">🎫</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Open Tickets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {loading ? "..." : stats.openTickets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/admin/customers")}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-left"
          >
            <div className="font-medium">Add Customer</div>
            <div className="text-sm opacity-90">Create a new customer account</div>
          </button>
          <button
            onClick={() => router.push("/admin/sites")}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-left"
          >
            <div className="font-medium">Add Site</div>
            <div className="text-sm opacity-90">Register a new site location</div>
          </button>
          <button
            onClick={() => router.push("/admin/machines")}
            className="px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-left"
          >
            <div className="font-medium">Add Machine</div>
            <div className="text-sm opacity-90">Register a new machine</div>
          </button>
        </div>
      </div>
    </div>
  );
}

