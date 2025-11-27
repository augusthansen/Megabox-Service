"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customer Dashboard
 * Overview of tickets, machines, and quick actions
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  machineDown: boolean;
  createdAt: string;
}

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  model: string;
  site: {
    name: string;
  };
}

export default function CustomerDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData(parsedUser);
    }
  }, []);

  const fetchData = async (user: any) => {
    try {
      // Fetch tickets for user's company
      if (user.companyId) {
        const ticketsRes = await fetch(`/api/tickets?companyId=${user.companyId}`);
        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json();
          setTickets(ticketsData.slice(0, 5)); // Show last 5 tickets
        }

        const machinesRes = await fetch(`/api/machines?companyId=${user.companyId}`);
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json();
          setMachines(machinesData.slice(0, 6)); // Show 6 machines
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
      open: "bg-blue-100 text-blue-700",
      in_progress: "bg-yellow-100 text-yellow-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-slate-100 text-slate-700",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-primary-100 mb-6">
          Need help with a machine? Submit a service ticket and we'll get right on it.
        </p>
        <Link
          href="/customer/tickets/new"
          className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors shadow-md"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Submit Service Ticket
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Open Tickets</h3>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {tickets.filter(t => ["open", "in_progress"].includes(t.status)).length}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Total Machines</h3>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{machines.length}</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-500">Urgent Issues</h3>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {tickets.filter(t => t.machineDown || t.priority === "urgent").length}
          </p>
        </div>
      </div>

      {/* Recent Tickets */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Recent Tickets</h2>
          <Link
            href="/customer/tickets"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>
        
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-slate-500 mb-4">No tickets yet</p>
            <Link
              href="/customer/tickets/new"
              className="btn-primary"
            >
              Submit Your First Ticket
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/tickets/${ticket.id}`}
                className="block p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-slate-600">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    {ticket.machineDown && (
                      <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-700">
                        Machine Down
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-900 font-medium">{ticket.subject}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Machines Grid */}
      <div className="card p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">Your Machines</h2>
          <Link
            href="/customer/machines"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View All →
          </Link>
        </div>
        
        {machines.length === 0 ? (
          <p className="text-center text-slate-500 py-8">No machines found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {machines.map((machine) => (
              <div
                key={machine.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{machine.name}</h3>
                <p className="text-sm text-slate-600 mb-1">{machine.model}</p>
                {machine.serialNumber && (
                  <p className="text-xs text-slate-500">SN: {machine.serialNumber}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">📍 {machine.site.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

