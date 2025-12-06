"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * Customer Tickets List Page
 * View all tickets with filtering by status and machine
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  machineDown: boolean;
  machineId: string | null;
  machine: {
    id: string;
    name: string;
    model: string;
  } | null;
  site: {
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Machine {
  id: string;
  name: string;
  site: {
    name: string;
  };
}

export default function CustomerTicketsPage() {
  const searchParams = useSearchParams();
  const machineIdParam = searchParams.get("machineId");

  const [user, setUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [machineFilter, setMachineFilter] = useState<string>(machineIdParam || "all");
  const [searchQuery, setSearchQuery] = useState<string>("");

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

  // Update machine filter when URL param changes
  useEffect(() => {
    if (machineIdParam) {
      setMachineFilter(machineIdParam);
    }
  }, [machineIdParam]);

  const fetchData = async (user: any) => {
    try {
      if (user.companyId) {
        // Fetch tickets and machines in parallel
        const [ticketsRes, machinesRes] = await Promise.all([
          fetch(`/api/tickets?companyId=${user.companyId}`),
          fetch(`/api/machines?companyId=${user.companyId}`)
        ]);

        if (ticketsRes.ok) {
          const data = await ticketsRes.json();
          setTickets(data);
        }

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
      open: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      assigned: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800",
      on_hold: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      resolved: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      closed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600";
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      low: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
      medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      high: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      urgent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return badges[priority] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  };

  // Filter tickets by status, machine, and search query
  const filteredTickets = tickets.filter((ticket) => {
    // Status filter
    if (statusFilter === "open" && !["open", "assigned", "in_progress"].includes(ticket.status)) return false;
    if (statusFilter === "closed" && !["resolved", "closed"].includes(ticket.status)) return false;
    if (statusFilter !== "all" && statusFilter !== "open" && statusFilter !== "closed" && ticket.status !== statusFilter) return false;

    // Machine filter
    if (machineFilter !== "all" && ticket.machineId !== machineFilter) return false;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesTicketNumber = ticket.ticketNumber.toLowerCase().includes(query);
      const matchesSubject = ticket.subject.toLowerCase().includes(query);
      const matchesDescription = ticket.description?.toLowerCase().includes(query);
      const matchesMachine = ticket.machine?.name.toLowerCase().includes(query);
      if (!matchesTicketNumber && !matchesSubject && !matchesDescription && !matchesMachine) return false;
    }

    return true;
  });

  // Get the selected machine name for display
  const selectedMachine = machines.find(m => m.id === machineFilter);

  // Clear machine filter
  const clearMachineFilter = () => {
    setMachineFilter("all");
    // Update URL without the machineId param
    window.history.replaceState({}, "", "/customer/tickets");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tickets</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
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

      {/* Machine Filter Banner (when filtering by machine) */}
      {machineFilter !== "all" && selectedMachine && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-purple-900 dark:text-purple-300">
                  Showing tickets for: {selectedMachine.name}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-400">
                  {selectedMachine.site.name}
                </p>
              </div>
            </div>
            <button
              onClick={clearMachineFilter}
              className="px-3 py-1.5 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card p-4 dark:bg-slate-800 dark:border-slate-700 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tickets by number, subject, or machine..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Status Filter Buttons */}
          <div className="flex flex-wrap gap-2 flex-1">
            {[
              { value: "all", label: "All", count: tickets.length },
              { value: "open", label: "Active", count: tickets.filter(t => ["open", "assigned", "in_progress"].includes(t.status)).length },
              { value: "resolved", label: "Resolved", count: tickets.filter(t => t.status === "resolved").length },
              { value: "closed", label: "Closed", count: tickets.filter(t => t.status === "closed").length },
            ].map((filterOption) => (
              <button
                key={filterOption.value}
                onClick={() => setStatusFilter(filterOption.value)}
                className={`px-3 py-1.5 rounded-lg font-medium text-sm transition-all ${
                  statusFilter === filterOption.value
                    ? "bg-primary-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {filterOption.label} ({filterOption.count})
              </button>
            ))}
          </div>

          {/* Machine Filter Dropdown */}
          <div className="sm:w-64">
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Machines</option>
              {machines.map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.name} - {machine.site.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {(searchQuery || machineFilter !== "all" || statusFilter !== "all") && (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {filteredTickets.length} of {tickets.length} tickets
          {searchQuery && <span> matching "{searchQuery}"</span>}
        </p>
      )}

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="card p-12 text-center dark:bg-slate-800 dark:border-slate-700">
          <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No tickets found</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {searchQuery
              ? `No tickets match "${searchQuery}"`
              : statusFilter === "all" && machineFilter === "all"
              ? "You haven't submitted any tickets yet"
              : "No tickets match your current filters"}
          </p>
          {(searchQuery || machineFilter !== "all" || statusFilter !== "all") ? (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setMachineFilter("all");
              }}
              className="btn-secondary mr-2"
            >
              Clear Filters
            </button>
          ) : null}
          <Link href="/customer/tickets/new" className="btn-primary">
            Submit a Ticket
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/customer/tickets/${ticket.id}`}
              className={`block card p-4 md:p-6 hover:shadow-lg transition-all border-l-4 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700/50 ${
                ticket.machineDown
                  ? "border-l-red-500 bg-red-50 dark:bg-red-900/10"
                  : "border-l-transparent hover:border-l-primary-500"
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Ticket Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {ticket.ticketNumber}
                    </span>
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                      {ticket.status.replace("_", " ").toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getPriorityBadge(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                    {ticket.machineDown && (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                        MACHINE DOWN
                      </span>
                    )}
                  </div>

                  <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-1 truncate">
                    {ticket.subject}
                  </h3>

                  {ticket.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-1">
                      {ticket.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
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
                    <p className="text-xs text-slate-500 dark:text-slate-400">Created</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
