"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Ticket Detail Page
 * 
 * View and manage an individual ticket with full details
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
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "",
    status: "",
    machineDown: false,
    assignedToId: "",
  });

  useEffect(() => {
    if (ticketId) {
      fetchTicket();
      fetchUsers();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        setFormData({
          subject: data.subject,
          description: data.description || "",
          priority: data.priority,
          status: data.status,
          machineDown: data.machineDown,
          assignedToId: data.assignedTo?.id || "",
        });
      } else {
        alert("Failed to load ticket");
        router.push("/admin/tickets");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        // Filter to only service techs and admins
        const techUsers = data.filter((u: User) => 
          u.role === "service_tech" || u.role === "super_admin"
        );
        setUsers(techUsers);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedToId: formData.assignedToId || null,
        }),
      });

      if (response.ok) {
        alert("Ticket updated successfully!");
        setEditing(false);
        fetchTicket(); // Refresh
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Something went wrong");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Ticket not found</p>
      </div>
    );
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/tickets"
            className="text-slate-500 hover:text-slate-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Ticket #{ticket.ticketNumber}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ticket.hubspotId && (
            <a
              href={`https://app.hubspot.com/contacts/ticket/${ticket.hubspotId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 0c-1.7 0-3.1 1.4-3.1 3.1 0 .4.1.8.2 1.1l-4.2 2.4c-.6-.4-1.3-.6-2-.6-2.1 0-3.8 1.7-3.8 3.8 0 .5.1.9.2 1.4l-3.1 2c-.4-.2-.9-.3-1.4-.3C.6 12.9 0 13.5 0 14.2s.6 1.3 1.3 1.3 1.3-.6 1.3-1.3c0-.3-.1-.5-.2-.7l3.1-2c.6.5 1.4.9 2.3.9 2.1 0 3.8-1.7 3.8-3.8 0-.5-.1-.9-.2-1.4l4.2-2.4c.6.4 1.3.6 2 .6 2 0 3.6-1.6 3.6-3.6S20.5 0 18.5 0zm0 2.2c.5 0 .9.4.9.9s-.4.9-.9.9-.9-.4-.9-.9.4-.9.9-.9zM9.4 11.2c-1.2 0-2.2-1-2.2-2.2s1-2.2 2.2-2.2 2.2 1 2.2 2.2-1 2.2-2.2 2.2zM1.3 15c-.2 0-.3-.1-.3-.3s.1-.3.3-.3.3.1.3.3-.1.3-.3.3zm17.2 3.6c-1.7 0-3.1 1.4-3.1 3.1s1.4 3.1 3.1 3.1 3.1-1.4 3.1-3.1-1.4-3.1-3.1-3.1zm0 4.8c-.9 0-1.7-.8-1.7-1.7s.8-1.7 1.7-1.7 1.7.8 1.7 1.7-.8 1.7-1.7 1.7z"/>
              </svg>
              View in HubSpot
            </a>
          )}
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn-primary"
            >
              Edit Ticket
            </button>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          {editing ? (
            <form onSubmit={handleUpdate} className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900">Edit Ticket</h2>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input min-h-[120px]"
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="open">Open</option>
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="input"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-700 mb-2">
                  Assigned To
                </label>
                <select
                  id="assignedTo"
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="input"
                >
                  <option value="">Unassigned</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.machineDown}
                    onChange={(e) => setFormData({ ...formData, machineDown: e.target.checked })}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-slate-700">Machine is down</span>
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    // Reset form to original values
                    setFormData({
                      subject: ticket.subject,
                      description: ticket.description || "",
                      priority: ticket.priority,
                      status: ticket.status,
                      machineDown: ticket.machineDown,
                      assignedToId: ticket.assignedTo?.id || "",
                    });
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <div className="card p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    {ticket.subject}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${statusBadges[ticket.status as keyof typeof statusBadges] || "badge-neutral"}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                    <span className={`badge ${priorityBadges[ticket.priority as keyof typeof priorityBadges] || "badge-neutral"}`}>
                      {ticket.priority} priority
                    </span>
                    {ticket.machineDown && (
                      <span className="badge badge-danger">
                        Machine Down
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {ticket.description || "No description provided."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Assignment</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Created By</p>
                <p className="text-sm font-medium text-slate-900">{ticket.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                <p className="text-sm font-medium text-slate-900">
                  {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
                </p>
              </div>
            </div>
          </div>

          {/* Location & Asset */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Location & Asset</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Customer</p>
                <Link
                  href={`/admin/customers/${ticket.company.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {ticket.company.name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Site</p>
                <Link
                  href={`/admin/sites/${ticket.site.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {ticket.site.name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Machine</p>
                {ticket.machine ? (
                  <Link
                    href={`/admin/machines/${ticket.machine.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {ticket.machine.name}
                    {ticket.machine.serialNumber && (
                      <span className="text-slate-500"> (SN: {ticket.machine.serialNumber})</span>
                    )}
                  </Link>
                ) : (
                  <p className="text-sm text-slate-500">No machine specified</p>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Timestamps</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Created</p>
                <p className="text-sm text-slate-700">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Updated</p>
                <p className="text-sm text-slate-700">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
