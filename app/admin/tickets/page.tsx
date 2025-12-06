"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Tickets Page
 * 
 * Shows a list of all tickets with filters and allows creating new ones.
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  machineDown: boolean;
  hubspotId: string | null;
  company: {
    id: string;
    name: string;
  };
  site: {
    id: string;
    name: string;
  };
  machine: {
    id: string;
    name: string;
    serialNumber: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
}

interface Site {
  id: string;
  name: string;
  companyId: string;
}

interface Machine {
  id: string;
  name: string;
  serialNumber: string | null;
  siteId: string;
}

export default function TicketsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const machineIdParam = searchParams.get("machineId");

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(!!machineIdParam);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
  });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    companyId: "",
    siteId: "",
    machineId: machineIdParam || "",
    subject: "",
    description: "",
    priority: "medium",
    machineDown: false,
  });

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Only fetch tickets after currentUser is loaded
    if (currentUser) {
      fetchTickets();
    }
    fetchCompanies();
  }, [filters, machineIdParam, currentUser]);

  useEffect(() => {
    if (formData.companyId) {
      fetchSites(formData.companyId);
    } else {
      setSites([]);
      setFormData({ ...formData, siteId: "", machineId: "" });
    }
  }, [formData.companyId]);

  useEffect(() => {
    if (formData.siteId) {
      fetchMachines(formData.siteId);
    } else {
      setMachines([]);
      setFormData({ ...formData, machineId: "" });
    }
  }, [formData.siteId]);

  const fetchTickets = async () => {
    try {
      let url = "/api/tickets";
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.priority) params.append("priority", filters.priority);
      if (machineIdParam) params.append("machineId", machineIdParam);
      // For service techs, only show tickets assigned to them
      if (currentUser?.role === "service_tech" && currentUser?.id) {
        params.append("assignedToId", currentUser.id);
      }
      if (params.toString()) url += "?" + params.toString();

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Error fetching tickets:", errorData);
        alert(`Failed to load tickets: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const fetchSites = async (companyId: string) => {
    try {
      const response = await fetch(`/api/sites?companyId=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        setSites(data);
      }
    } catch (error) {
      console.error("Error fetching sites:", error);
    }
  };

  const fetchMachines = async (siteId: string) => {
    try {
      const response = await fetch(`/api/machines?siteId=${siteId}`);
      if (response.ok) {
        const data = await response.json();
        setMachines(data);
      }
    } catch (error) {
      console.error("Error fetching machines:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      alert("Please log in to create tickets");
      return;
    }

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          createdById: currentUser.id,
        }),
      });

      if (response.ok) {
        // Success! Refresh the list and reset form
        setShowAddForm(false);
        setFormData({
          companyId: "",
          siteId: "",
          machineId: "",
          subject: "",
          description: "",
          priority: "medium",
          machineDown: false,
        });
        fetchTickets(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Something went wrong");
    }
  };

  const handleSyncFromHubspot = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/hubspot/sync-tickets", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Sync complete!\n\nSynced: ${data.synced} new tickets\nUpdated: ${data.updated} existing tickets\nErrors: ${data.errors}`);
        fetchTickets(); // Refresh the list
      } else {
        alert(data.error || "Failed to sync from HubSpot");
      }
    } catch (error) {
      console.error("Error syncing from HubSpot:", error);
      alert("Something went wrong while syncing");
    } finally {
      setSyncing(false);
    }
  };

  const handleSyncToHubspot = async () => {
    if (!confirm("This will sync all local tickets that don't have a HubSpot ID to HubSpot. Continue?")) {
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch("/api/tickets/sync-to-hubspot", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        if (data.synced === 0) {
          alert("All tickets are already synced to HubSpot!");
        } else {
          let message = `Sync complete!\n\n✅ Synced: ${data.synced} tickets to HubSpot\n❌ Errors: ${data.errors}`;
          
          if (data.details?.synced && data.details.synced.length > 0) {
            message += `\n\nSynced tickets:\n${data.details.synced.map((s: any) => `- ${s.ticket} (HubSpot ID: ${s.hubspotId})`).join("\n")}`;
          }
          
          if (data.errors > 0 && data.details?.errors) {
            message += `\n\nErrors:\n${data.details.errors.map((e: any) => `- ${e.ticket}: ${e.error}${e.details ? ` (${e.details})` : ""}`).join("\n")}`;
          }
          
          alert(message);
        }
        fetchTickets(); // Refresh the list
      } else {
        const errorMsg = data.error || data.details || "Failed to sync to HubSpot";
        alert(`Error: ${errorMsg}\n\nCheck the browser console and server logs for details.`);
        console.error("Sync error response:", data);
      }
    } catch (error) {
      console.error("Error syncing to HubSpot:", error);
      alert("Something went wrong while syncing");
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tickets</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {currentUser?.role === "service_tech"
              ? "View and manage tickets assigned to you"
              : "Manage service tickets and support requests"}
          </p>
        </div>
        {/* Only show admin actions for non-service-tech users */}
        {currentUser?.role !== "service_tech" && (
          <div className="flex gap-3">
            <button
              onClick={handleSyncToHubspot}
              disabled={syncing}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Sync local tickets to HubSpot"
            >
              <svg className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {syncing ? "Syncing..." : "Sync to HubSpot"}
            </button>
            <button
              onClick={handleSyncFromHubspot}
              disabled={syncing}
              className="btn-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Sync tickets from HubSpot to app"
            >
              <svg className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {syncing ? "Syncing..." : "Sync from HubSpot"}
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-primary"
            >
              {showAddForm ? "Cancel" : "+ Create Ticket"}
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-4">
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Status
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Priority
            </label>
            <select
              id="filter-priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input"
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create Ticket Form - Only for admins */}
      {showAddForm && currentUser?.role !== "service_tech" && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create New Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Customer *
                </label>
                <select
                  id="companyId"
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value, siteId: "", machineId: "" })}
                  className="input"
                >
                  <option value="">Select customer</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="siteId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Site *
                </label>
                <select
                  id="siteId"
                  required
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value, machineId: "" })}
                  disabled={!formData.companyId}
                  className="input"
                >
                  <option value="">Select site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="machineId" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Machine (Optional)
                </label>
                <select
                  id="machineId"
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  disabled={!formData.siteId}
                  className="input"
                >
                  <option value="">No machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name} {machine.serialNumber && `(${machine.serialNumber})`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Subject *
              </label>
              <input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input"
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder="Detailed description of the issue..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.machineDown}
                    onChange={(e) => setFormData({ ...formData, machineDown: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Machine is down</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Table */}
      <div className="table-container overflow-x-auto">
        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {currentUser?.role === "service_tech"
                ? "No tickets assigned to you. Tickets must be assigned to you by an administrator to appear here."
                : "No tickets found"}
            </p>
            {currentUser?.role !== "service_tech" && (
              <button
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
              >
                Create Your First Ticket
              </button>
            )}
          </div>
        ) : (
          <table className="table min-w-full">
            <thead>
              <tr>
                <th>Ticket #</th>
                <th>Subject</th>
                <th>Customer</th>
                <th>Site</th>
                <th>Machine</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => {
                const priorityBadges = {
                  low: "badge-neutral",
                  medium: "badge-info",
                  high: "badge-warning",
                  urgent: "badge-danger",
                };

                const statusBadges = {
                  open: "badge-info",
                  assigned: "badge-info",
                  in_progress: "badge-warning",
                  on_hold: "badge-warning",
                  resolved: "badge-success",
                  closed: "badge-neutral",
                };

                return (
                  <tr
                    key={ticket.id}
                    className="hover:bg-primary-50 dark:hover:bg-slate-700 cursor-pointer transition-colors group"
                    onClick={() => router.push(`/admin/tickets/${ticket.id}`)}
                  >
                    <td>
                      <div className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                        {ticket.ticketNumber}
                      </div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-900 dark:text-white">{ticket.subject}</div>
                      {ticket.machineDown && (
                        <span className="inline-block mt-1 badge badge-danger">
                          Machine Down
                        </span>
                      )}
                    </td>
                    <td>
                      <Link
                        href={`/admin/customers/${ticket.company.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.company.name}
                      </Link>
                    </td>
                    <td>
                      <Link
                        href={`/admin/sites/${ticket.site.id}`}
                        className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ticket.site.name}
                      </Link>
                    </td>
                    <td>
                      {ticket.machine ? (
                        <Link
                          href={`/admin/machines/${ticket.machine.id}`}
                          className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {ticket.machine.name}
                        </Link>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${priorityBadges[ticket.priority as keyof typeof priorityBadges] || "badge-neutral"}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadges[ticket.status as keyof typeof statusBadges] || "badge-neutral"}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/admin/tickets/${ticket.id}`}
                          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium underline group-hover:text-primary-700"
                        >
                          View Details →
                        </Link>
                        {ticket.hubspotId && (
                          <a
                            href={`https://app.hubspot.com/contacts/ticket/${ticket.hubspotId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-orange-600 dark:text-slate-400 dark:hover:text-orange-400 transition-colors"
                            title="View in HubSpot"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18.5 0c-1.7 0-3.1 1.4-3.1 3.1 0 .4.1.8.2 1.1l-4.2 2.4c-.6-.4-1.3-.6-2-.6-2.1 0-3.8 1.7-3.8 3.8 0 .5.1.9.2 1.4l-3.1 2c-.4-.2-.9-.3-1.4-.3C.6 12.9 0 13.5 0 14.2s.6 1.3 1.3 1.3 1.3-.6 1.3-1.3c0-.3-.1-.5-.2-.7l3.1-2c.6.5 1.4.9 2.3.9 2.1 0 3.8-1.7 3.8-3.8 0-.5-.1-.9-.2-1.4l4.2-2.4c.6.4 1.3.6 2 .6 2 0 3.6-1.6 3.6-3.6S20.5 0 18.5 0zm0 2.2c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zM9.4 11.2c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2 2.2 1 2.2 2.2-1 2.2-2.2 2.2zM1.3 15c-.2 0-.3-.1-.3-.3s.1-.3.3-.3.3.1.3.3-.1.3-.3.3zm17.2 3.6c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1zm0 4.8c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7 1.7.8 1.7 1.7-.8 1.7-1.7 1.7z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

