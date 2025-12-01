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
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);
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
    // Fetch current user from session API
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/session");
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setCurrentUser(data.user);
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchCompanies();
  }, [filters, machineIdParam]);

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
      if (params.toString()) url += "?" + params.toString();

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading tickets...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Tickets</h2>
        <div className="flex gap-3">
          <button
            onClick={handleSyncFromHubspot}
            disabled={syncing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? "Syncing..." : "🔄 Sync from HubSpot"}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? "Cancel" : "+ Create Ticket"}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div>
            <label htmlFor="filter-status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="filter-status"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <label htmlFor="filter-priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="filter-priority"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

      {/* Create Ticket Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Ticket</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 mb-1">
                  Customer *
                </label>
                <select
                  id="companyId"
                  required
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value, siteId: "", machineId: "" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                <label htmlFor="siteId" className="block text-sm font-medium text-gray-700 mb-1">
                  Site *
                </label>
                <select
                  id="siteId"
                  required
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value, machineId: "" })}
                  disabled={!formData.companyId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
                <label htmlFor="machineId" className="block text-sm font-medium text-gray-700 mb-1">
                  Machine (Optional)
                </label>
                <select
                  id="machineId"
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  disabled={!formData.siteId}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
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
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
              </label>
              <input
                id="subject"
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the issue"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed description of the issue..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Machine is down</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Ticket
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No tickets found</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Your First Ticket
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ticket #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Site
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Machine
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.ticketNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{ticket.subject}</div>
                    {ticket.machineDown && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Machine Down
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/customers/${ticket.company.id}`}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      {ticket.company.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/sites/${ticket.site.id}`}
                      className="text-sm text-blue-600 hover:text-blue-900"
                    >
                      {ticket.site.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {ticket.machine ? (
                      <Link
                        href={`/admin/machines/${ticket.machine.id}`}
                        className="text-sm text-blue-600 hover:text-blue-900"
                      >
                        {ticket.machine.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.priority === "urgent"
                        ? "bg-red-100 text-red-800"
                        : ticket.priority === "high"
                        ? "bg-orange-100 text-orange-800"
                        : ticket.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      ticket.status === "open"
                        ? "bg-blue-100 text-blue-800"
                        : ticket.status === "in_progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : ticket.status === "resolved" || ticket.status === "closed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={`/admin/tickets/${ticket.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

