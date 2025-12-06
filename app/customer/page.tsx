"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customer Dashboard
 * Enhanced overview with machine status alerts, tickets, and quick actions
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  machineDown: boolean;
  createdAt: string;
  machine?: {
    id: string;
    name: string;
  } | null;
}

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  model: string | null;
  status: string | null;
  isCurrentlyDown: boolean;
  site: {
    name: string;
  };
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData(parsedUser);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchData = async (user: any) => {
    try {
      if (user.companyId) {
        const ticketsRes = await fetch(`/api/tickets?companyId=${user.companyId}`);
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setAllTickets(ticketsData);
          setTickets(ticketsData.slice(0, 5));
        }

        const machinesRes = await fetch(`/api/machines?companyId=${user.companyId}`);
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          setMachines(machinesData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      assigned: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      in_progress: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      resolved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      closed: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300";
  };

  const getMachineStatusColor = (status: string | null) => {
    if (!status) return "bg-slate-100 dark:bg-slate-700";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 dark:bg-green-900/30";
      case "down":
        return "bg-red-100 dark:bg-red-900/30";
      case "maintenance":
        return "bg-yellow-100 dark:bg-yellow-900/30";
      default:
        return "bg-slate-100 dark:bg-slate-700";
    }
  };

  const getMachineStatusIcon = (status: string | null, isDown: boolean) => {
    if (isDown || status?.toLowerCase() === "down") {
      return (
        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }
    if (status?.toLowerCase() === "active") {
      return (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (status?.toLowerCase() === "maintenance") {
      return (
        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    );
  };

  // Calculate stats
  const downMachines = machines.filter(m => m.isCurrentlyDown || m.status?.toLowerCase() === "down");
  const activeMachines = machines.filter(m => m.status?.toLowerCase() === "active" && !m.isCurrentlyDown);
  const maintenanceMachines = machines.filter(m => m.status?.toLowerCase() === "maintenance");
  const openTickets = allTickets.filter(t => ["open", "assigned", "in_progress"].includes(t.status));
  const urgentIssues = allTickets.filter(t => t.machineDown || t.priority === "urgent");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Machine Down Alert Banner */}
      {downMachines.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-xl p-4 shadow-lg animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 dark:text-red-300">
                {downMachines.length} Machine{downMachines.length > 1 ? "s" : ""} Currently Down
              </h3>
              <p className="text-red-700 dark:text-red-400 text-sm mt-1">
                {downMachines.map(m => m.name).join(", ")}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {downMachines.slice(0, 3).map(machine => (
                  <Link
                    key={machine.id}
                    href={`/customer/tickets/new?machineId=${machine.id}`}
                    className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Report Issue: {machine.name}
                  </Link>
                ))}
                {downMachines.length > 3 && (
                  <Link
                    href="/customer/machines"
                    className="inline-flex items-center px-3 py-1.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors"
                  >
                    View All ({downMachines.length})
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100 mb-6">
          Need help with a machine? Submit a service ticket and we'll get right on it.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/customer/tickets/new"
            className="inline-flex items-center px-5 py-2.5 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Submit Service Ticket
          </Link>
          <Link
            href="/customer/machines"
            className="inline-flex items-center px-5 py-2.5 bg-primary-400/30 text-white font-semibold rounded-lg hover:bg-primary-400/50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            View Machines
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/customer/tickets" className="card p-4 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Open Tickets</h3>
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{openTickets.length}</p>
        </Link>

        <Link href="/customer/machines" className="card p-4 dark:bg-slate-800 dark:border-slate-700 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Machines Active</h3>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white">{activeMachines.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">of {machines.length} total</p>
        </Link>

        <div className={`card p-4 dark:bg-slate-800 dark:border-slate-700 ${downMachines.length > 0 ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Machines Down</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${downMachines.length > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <svg className={`w-5 h-5 ${downMachines.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${downMachines.length > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {downMachines.length}
          </p>
        </div>

        <div className={`card p-4 dark:bg-slate-800 dark:border-slate-700 ${urgentIssues.length > 0 ? 'border-yellow-300 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Urgent Issues</h3>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${urgentIssues.length > 0 ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
              <svg className={`w-5 h-5 ${urgentIssues.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400 dark:text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p className={`text-3xl font-bold ${urgentIssues.length > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
            {urgentIssues.length}
          </p>
        </div>
      </div>

      {/* Machine Status Overview */}
      <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Machine Status Overview</h2>
          <Link
            href="/customer/machines"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View All →
          </Link>
        </div>

        {machines.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-4">No machines found</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {machines.slice(0, 6).map((machine) => (
              <Link
                key={machine.id}
                href={`/customer/machines/${machine.id}`}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${
                  machine.isCurrentlyDown || machine.status?.toLowerCase() === "down"
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:border-red-400"
                    : "border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600"
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getMachineStatusColor(machine.isCurrentlyDown ? "down" : machine.status)}`}>
                  {getMachineStatusIcon(machine.status, machine.isCurrentlyDown)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 dark:text-white truncate">{machine.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{machine.site.name}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  machine.isCurrentlyDown || machine.status?.toLowerCase() === "down"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    : machine.status?.toLowerCase() === "active"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : machine.status?.toLowerCase() === "maintenance"
                    ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}>
                  {machine.isCurrentlyDown ? "Down" : machine.status || "Unknown"}
                </span>
              </Link>
            ))}
          </div>
        )}

        {machines.length > 6 && (
          <div className="mt-4 text-center">
            <Link
              href="/customer/machines"
              className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              + {machines.length - 6} more machines
            </Link>
          </div>
        )}
      </div>

      {/* Recent Tickets */}
      <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Tickets</h2>
          <Link
            href="/customer/tickets"
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View All →
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 mb-4">No tickets yet</p>
            <Link href="/customer/tickets/new" className="btn-primary">
              Submit Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/tickets/${ticket.id}`}
                className={`block p-4 rounded-lg border transition-all hover:shadow-md ${
                  ticket.machineDown
                    ? "border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10 hover:border-red-400"
                    : "border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-medium text-slate-600 dark:text-slate-300">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    {ticket.machineDown && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                        Machine Down
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-900 dark:text-white font-medium">{ticket.subject}</p>
                {ticket.machine && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Machine: {ticket.machine.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/customer/tickets/new"
          className="card p-5 dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">New Ticket</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Report an issue</p>
            </div>
          </div>
        </Link>

        <Link
          href="/customer/tickets"
          className="card p-5 dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">View Tickets</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Track your requests</p>
            </div>
          </div>
        </Link>

        <Link
          href="/customer/settings"
          className="card p-5 dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Settings</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Account preferences</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
