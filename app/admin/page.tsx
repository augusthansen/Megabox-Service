"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Admin Dashboard Page
 * Enterprise-grade dashboard with modern cards, metrics, and charts
 */

interface Stats {
  customers: number;
  sites: number;
  machines: number;
  openTickets: number;
  detailed?: DetailedStats;
}

interface DetailedStats {
  ticketsToday: number;
  ticketsThisWeek: number;
  ticketsThisMonth: number;
  resolvedThisWeek: number;
  resolvedThisMonth: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  urgentOpenTickets: number;
  machineDownTickets: number;
  avgSatisfactionRating: number | null;
  recentTickets: RecentTicket[];
  ticketTrend: TicketTrend[];
}

interface RecentTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  company: { name: string };
  assignedTo: { name: string } | null;
}

interface TicketTrend {
  date: string;
  created: number;
  resolved: number;
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
  const [detailedLoading, setDetailedLoading] = useState(true);

  useEffect(() => {
    // Get user from sessionStorage (layout already checked auth)
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

      // Fetch stats after user is loaded
      fetchStats(parsedUser);
      fetchDetailedStats(parsedUser);
    }
  }, []);

  const fetchStats = async (currentUser?: any) => {
    try {
      let url = "/api/stats";
      const userToUse = currentUser || user;
      if (userToUse?.id && userToUse?.role) {
        url += `?userId=${userToUse.id}&userRole=${userToUse.role}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedStats = async (currentUser?: any) => {
    try {
      let url = "/api/stats?detailed=true";
      const userToUse = currentUser || user;
      if (userToUse?.id && userToUse?.role) {
        url += `&userId=${userToUse.id}&userRole=${userToUse.role}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setStats((prev) => ({ ...prev, ...data }));
      }
    } catch (error) {
      console.error("Error fetching detailed stats:", error);
    } finally {
      setDetailedLoading(false);
    }
  };

  const statCards = [
    {
      name: "Total Customers",
      value: stats.customers,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      href: "/admin/customers",
    },
    {
      name: "Active Sites",
      value: stats.sites,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
      href: "/admin/sites",
    },
    {
      name: "Total Machines",
      value: stats.machines,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
          />
        </svg>
      ),
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
      href: "/admin/machines",
    },
    {
      name: "Open Tickets",
      value: stats.openTickets,
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
          />
        </svg>
      ),
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
      href: "/admin/tickets",
    },
  ];

  const quickActions = [
    {
      name: "Create Ticket",
      description: "Open a new service ticket",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      href: "/admin/tickets",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      name: "Add Customer",
      description: "Onboard a new customer",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      href: "/admin/customers",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    {
      name: "Sync HubSpot",
      description: "Update from HubSpot CRM",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      ),
      href: "/admin/customers",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  ];

  const statusColors: Record<string, string> = {
    open: "bg-blue-500",
    assigned: "bg-purple-500",
    in_progress: "bg-yellow-500",
    on_hold: "bg-orange-500",
    resolved: "bg-green-500",
    closed: "bg-slate-400",
  };

  const priorityColors: Record<string, string> = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-yellow-500",
    urgent: "bg-red-500",
  };

  const getMaxTrendValue = () => {
    if (!stats.detailed?.ticketTrend) return 10;
    const max = Math.max(
      ...stats.detailed.ticketTrend.map((t) => Math.max(t.created, t.resolved))
    );
    return max > 0 ? max : 10;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      open: "Open",
      assigned: "Assigned",
      in_progress: "In Progress",
      on_hold: "On Hold",
      resolved: "Resolved",
      closed: "Closed",
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      low: "Low",
      medium: "Medium",
      high: "High",
      urgent: "Urgent",
    };
    return labels[priority] || priority;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Welcome back, {user?.name || "Admin"}. Here's what's happening today.
        </p>
      </div>

      {/* Alert Cards - Urgent tickets and machine down */}
      {stats.detailed && (stats.detailed.urgentOpenTickets > 0 || stats.detailed.machineDownTickets > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.detailed.urgentOpenTickets > 0 && (
            <Link
              href="/admin/tickets?priority=urgent"
              className="card p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                    {stats.detailed.urgentOpenTickets} Urgent Ticket{stats.detailed.urgentOpenTickets !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400">Requires immediate attention</p>
                </div>
                <svg className="w-5 h-5 text-red-400 dark:text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {stats.detailed.machineDownTickets > 0 && (
            <Link
              href="/admin/tickets?machineDown=true"
              className="card p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900 dark:text-orange-300">
                    {stats.detailed.machineDownTickets} Machine Down
                  </p>
                  <p className="text-xs text-orange-700 dark:text-orange-400">Production impacted</p>
                </div>
                <svg className="w-5 h-5 text-orange-400 dark:text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}
        </div>
      )}

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
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                    {stat.name}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {loading ? (
                      <span className="inline-block w-12 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></span>
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.bgColor} ${stat.iconColor} group-hover:scale-110 transition-transform`}
                >
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
      </div>

      {/* Charts and Metrics Row */}
      {stats.detailed && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Activity Summary */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ticket Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Today</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.detailed.ticketsToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Week</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.detailed.ticketsThisWeek}</span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    ({stats.detailed.resolvedThisWeek} resolved)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">This Month</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900 dark:text-white">{stats.detailed.ticketsThisMonth}</span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">
                    ({stats.detailed.resolvedThisMonth} resolved)
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Avg. Satisfaction</span>
                  <div className="flex items-center gap-2">
                    {stats.detailed.avgSatisfactionRating ? (
                      <>
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${
                                star <= Math.round(stats.detailed?.avgSatisfactionRating || 0)
                                  ? "text-yellow-400"
                                  : "text-slate-200"
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {stats.detailed.avgSatisfactionRating.toFixed(1)}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-400 dark:text-slate-500">No ratings yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tickets by Status */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Tickets by Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.detailed.statusCounts || {}).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status] || "bg-slate-400"}`}></div>
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex-1">{getStatusLabel(status)}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                </div>
              ))}
              {Object.keys(stats.detailed.statusCounts || {}).length === 0 && (
                <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">No tickets yet</p>
              )}
            </div>
          </div>

          {/* Tickets by Priority */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Open by Priority</h3>
            <div className="space-y-3">
              {["urgent", "high", "medium", "low"].map((priority) => {
                const count = stats.detailed?.priorityCounts?.[priority] || 0;
                const total = Object.values(stats.detailed?.priorityCounts || {}).reduce((a, b) => a + b, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={priority}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{getPriorityLabel(priority)}</span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{count}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${priorityColors[priority]} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Ticket Trend Chart */}
      {stats.detailed?.ticketTrend && stats.detailed.ticketTrend.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">7-Day Ticket Trend</h3>
          <div className="flex items-end gap-4 h-48">
            {stats.detailed.ticketTrend.map((day, index) => {
              const maxValue = getMaxTrendValue();
              const createdHeight = (day.created / maxValue) * 100;
              const resolvedHeight = (day.resolved / maxValue) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="flex-1 w-full flex items-end gap-1 mb-2">
                    {/* Created bar */}
                    <div
                      className="flex-1 bg-blue-500 rounded-t transition-all duration-500 relative group"
                      style={{ height: `${Math.max(createdHeight, 4)}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.created}
                      </span>
                    </div>
                    {/* Resolved bar */}
                    <div
                      className="flex-1 bg-green-500 rounded-t transition-all duration-500 relative group"
                      style={{ height: `${Math.max(resolvedHeight, 4)}%` }}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        {day.resolved}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(day.date).toLocaleDateString("en-US", { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Created</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-600 dark:text-slate-400">Resolved</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Only for admins */}
      {user?.role !== "service_tech" && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="card card-hover p-5 group"
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.bgColor} ${action.iconColor} group-hover:scale-110 transition-transform`}
                  >
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {action.name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      {action.description}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-1 transition-all"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Tickets */}
      {stats.detailed?.recentTickets && stats.detailed.recentTickets.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Tickets</h2>
            <Link href="/admin/tickets" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Ticket</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Customer</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Priority</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Assigned</th>
                  <th className="pb-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {stats.detailed.recentTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                    <td className="py-3">
                      <Link
                        href={`/admin/tickets/${ticket.id}`}
                        className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {ticket.ticketNumber}
                      </Link>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">{ticket.subject}</p>
                    </td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">{ticket.company.name}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ticket.status === "open"
                            ? "bg-blue-100 text-blue-700"
                            : ticket.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : ticket.status === "resolved"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ticket.priority === "urgent"
                            ? "bg-red-100 text-red-700"
                            : ticket.priority === "high"
                            ? "bg-orange-100 text-orange-700"
                            : ticket.priority === "medium"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-700 dark:text-slate-300">
                      {ticket.assignedTo?.name || (
                        <span className="text-slate-400 dark:text-slate-500">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loading state for detailed stats */}
      {detailedLoading && !stats.detailed && (
        <div className="card p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
