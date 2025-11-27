"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Customer Tickets List Page
 * View all tickets for the customer's company
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  machineDown: boolean;
  machine: {
    name: string;
    model: string;
  } | null;
  site: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function CustomerTicketsPage() {
  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchTickets(parsedUser);
    }
  }, []);

  const fetchTickets = async (user: any) => {
    try {
      if (user.companyId) {
        const response = await fetch(`/api/tickets?companyId=${user.companyId}`);
        if (response.ok) {
          const data = await response.json();
          setTickets(data);
        }
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: "bg-blue-100 text-blue-700 border-blue-200",
      assigned: "bg-purple-100 text-purple-700 border-purple-200",
      in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
      on_hold: "bg-orange-100 text-orange-700 border-orange-200",
      resolved: "bg-green-100 text-green-700 border-green-200",
      closed: "bg-slate-100 text-slate-700 border-slate-200",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: "bg-slate-100 text-slate-600",
      medium: "bg-blue-100 text-blue-700",
      high: "bg-yellow-100 text-yellow-700",
      urgent: "bg-red-100 text-red-700",
    };
    return badges[priority] || "bg-slate-100 text-slate-600";
  };

  const filteredTickets = tickets.filter((ticket) => {
    if (filter === "all") return true;
    if (filter === "open") return ["open", "assigned", "in_progress"].includes(ticket.status);
    if (filter === "closed") return ["resolved", "closed"].includes(ticket.status);
    return ticket.status === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Tickets</h1>
          <p className="mt-1 text-slate-600">
            Track and manage your service requests
          </p>
        </div>
        <Link
          href="/customer/tickets/new"
          className="btn-primary whitespace-nowrap"
        >
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "All Tickets", count: tickets.length },
            { value: "open", label: "Active", count: tickets.filter(t => ["open", "assigned", "in_progress"].includes(t.status)).length },
            { value: "resolved", label: "Resolved", count: tickets.filter(t => t.status === "resolved").length },
            { value: "closed", label: "Closed", count: tickets.filter(t => t.status === "closed").length },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                filter === filterOption.value
                  ? "bg-primary-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {filterOption.label} ({filterOption.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="card p-12 text-center">
          <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No tickets found</h3>
          <p className="text-slate-500 mb-6">
            {filter === "all"
              ? "You haven't submitted any tickets yet"
              : `No ${filter} tickets found`}
          </p>
          <Link href="/customer/tickets/new" className="btn-primary">
            Submit Your First Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/customer/tickets/${ticket.id}`}
              className="block card p-6 hover:shadow-lg transition-all border-l-4 border-l-transparent hover:border-l-primary-500"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Ticket Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    {ticket.machineDown && (
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-700 border border-red-200">
                        🚨 MACHINE DOWN
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {ticket.subject}
                  </h3>
                  
                  {ticket.description && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {ticket.site.name}
                    </span>
                    {ticket.machine && (
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                        {ticket.machine.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Date & Arrow */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Created</p>
                    <p className="text-sm font-medium text-slate-900">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

