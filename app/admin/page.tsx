"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Admin Dashboard Page
 * Enterprise-grade dashboard with modern cards and metrics
 */

interface Stats {
  customers: number;
  sites: number;
  machines: number;
  openTickets: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({
    customers: 0,
    sites: 0,
    machines: 0,
    openTickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get user from sessionStorage (layout already checked auth)
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch stats after user is loaded
      fetchStats(parsedUser);
    }
  }, []);

  const fetchStats = async (currentUser?: any) => {
    try {
      // Pass user info to filter stats for service techs
      let url = "/api/stats";
      const userToUse = currentUser || user;
      if (userToUse?.id && userToUse?.role) {
        url += `?userId=${userToUse.id}&userRole=${userToUse.role}`;
      }
      const response = await fetch(url);
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

  const statCards = [
    {
      name: "Total Customers",
      value: stats.customers,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      bgColor: "bg-primary-50",
      iconColor: "text-primary-600",
      href: "/admin/customers",
    },
    {
      name: "Active Sites",
      value: stats.sites,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      bgColor: "bg-success-50",
      iconColor: "text-success-600",
      href: "/admin/sites",
    },
    {
      name: "Total Machines",
      value: stats.machines,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      bgColor: "bg-slate-50",
      iconColor: "text-slate-600",
      href: "/admin/machines",
    },
    {
      name: "Open Tickets",
      value: stats.openTickets,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      bgColor: "bg-warning-50",
      iconColor: "text-warning-600",
      href: "/admin/tickets",
    },
  ];

  const quickActions = [
    {
      name: "Create Ticket",
      description: "Open a new service ticket",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: "/admin/tickets",
      color: "primary",
    },
    {
      name: "Add Customer",
      description: "Onboard a new customer",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      href: "/admin/customers",
      color: "success",
    },
    {
      name: "Sync HubSpot",
      description: "Update from HubSpot CRM",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      href: "/admin/customers",
      color: "slate",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back, {user?.name || "Admin"}. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid - Filter for service techs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards
          .filter((stat) => {
            // Service techs only see "Open Tickets" stat
            if (user?.role === "service_tech") {
              return stat.name === "Open Tickets";
            }
            return true;
          })
          .map((stat) => (
            <Link
              key={stat.name}
              href={stat.href}
              className="card card-hover p-6 group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-slate-900">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-slate-200 rounded animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor} ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
      </div>

      {/* Quick Actions - Only for admins */}
      {user?.role !== "service_tech" && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="card card-hover p-5 group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    action.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                    action.color === 'success' ? 'bg-success-50 text-success-600' :
                    'bg-slate-100 text-slate-600'
                  } group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {action.name}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity - Placeholder */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>
        <div className="space-y-4">
          <p className="text-sm text-slate-500 text-center py-8">
            Activity feed coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}
