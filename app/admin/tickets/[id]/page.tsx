"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CollapsibleSection } from "@/components/ui/collapsible";

/**
 * Ticket Detail Page
 * 
 * Shows ticket information and allows editing.
 */

interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

interface Session {
  id: string;
  type: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  machineDown: boolean;
  totalMinutes: number;
  totalCost: number;
  company: {
    id: string;
    name: string;
    pricingTier: string;
  };
  site: {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
  };
  machine: {
    id: string;
    name: string;
    model: string | null;
    serialNumber: string | null;
    status: string | null;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  sessions: Session[];
  comments: Comment[];
  createdAt: string;
  resolvedAt: string | null;
  closedAt: string | null;
}

interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    status: "",
    priority: "",
    subject: "",
    description: "",
    machineDown: false,
  });
  const [newComment, setNewComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Check if current user can see/create internal comments
  const canSeeInternal = currentUser?.role === "super_admin" || currentUser?.role === "service_tech";

  useEffect(() => {
    fetchTicket();
    fetchCurrentUser();
  }, [ticketId]);

  const fetchCurrentUser = async () => {
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

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        setEditData({
          status: data.status,
          priority: data.priority,
          subject: data.subject,
          description: data.description || "",
          machineDown: data.machineDown,
        });
      } else {
        router.push("/admin/tickets");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      router.push("/admin/tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!ticket) return;

    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setEditing(false);
        fetchTicket(); // Refresh ticket data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update ticket");
      }
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Something went wrong");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          isInternal: isInternalComment,
        }),
      });

      if (response.ok) {
        setNewComment("");
        setIsInternalComment(false);
        fetchTicket(); // Refresh to show new comment
      } else {
        const data = await response.json();
        alert(data.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Something went wrong");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <div>
      {/* Back Button */}
      <div className="mb-4">
        <Link
          href="/admin/tickets"
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          ← Back to Tickets
        </Link>
      </div>

      {/* Ticket Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {editing ? (
                <input
                  type="text"
                  value={editData.subject}
                  onChange={(e) => setEditData({ ...editData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                ticket.subject
              )}
            </h2>
            <p className="text-gray-600">Ticket #{ticket.ticketNumber}</p>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    fetchTicket(); // Reset to original data
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {/* Status and Priority */}
        <div className="flex gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            {editing ? (
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
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
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            {editing ? (
              <select
                value={editData.priority}
                onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            ) : (
              <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${
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
            )}
          </div>
          {ticket.machineDown && (
            <div className="flex items-end">
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
                Machine Down
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          {editing ? (
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          ) : (
            <p className="text-gray-600 whitespace-pre-wrap">{ticket.description || "No description"}</p>
          )}
        </div>

        {/* Machine Down Checkbox */}
        {editing && (
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={editData.machineDown}
                onChange={(e) => setEditData({ ...editData, machineDown: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Machine is down</span>
            </label>
          </div>
        )}

        {/* Ticket Info Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Customer</p>
            <Link
              href={`/admin/customers/${ticket.company.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-900"
            >
              {ticket.company.name}
            </Link>
          </div>
          <div>
            <p className="text-sm text-gray-500">Site</p>
            <Link
              href={`/admin/sites/${ticket.site.id}`}
              className="text-sm font-medium text-blue-600 hover:text-blue-900"
            >
              {ticket.site.name}
            </Link>
          </div>
          {ticket.machine && (
            <div>
              <p className="text-sm text-gray-500">Machine</p>
              <Link
                href={`/admin/machines/${ticket.machine.id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-900"
              >
                {ticket.machine.name} {ticket.machine.serialNumber && `(${ticket.machine.serialNumber})`}
              </Link>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Created By</p>
            <p className="text-sm font-medium text-gray-900">{ticket.createdBy.name}</p>
          </div>
          {ticket.assignedTo && (
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="text-sm font-medium text-gray-900">{ticket.assignedTo.name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>
          {ticket.resolvedAt && (
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(ticket.resolvedAt).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Time and Cost */}
        {(ticket.totalMinutes > 0 || ticket.totalCost > 0) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Time</p>
                <p className="text-lg font-semibold text-gray-900">{ticket.totalMinutes} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-lg font-semibold text-gray-900">${ticket.totalCost.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions Section */}
      {ticket.sessions.length > 0 && (
        <div className="mb-6">
          <CollapsibleSection
            title="Sessions"
            count={ticket.sessions.length}
            defaultOpen={false}
          >
            <div className="max-h-64 overflow-y-auto pr-2">
              <div className="space-y-3">
                {ticket.sessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{session.type.replace("_", " ")}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(session.startTime).toLocaleString()}
                          {session.endTime && ` - ${new Date(session.endTime).toLocaleString()}`}
                        </p>
                        {session.durationMinutes && (
                          <p className="text-sm text-gray-500 mt-1">
                            Duration: {session.durationMinutes} minutes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Comments / Communication Section */}
      <div className="mb-6">
        <CollapsibleSection
          title="Communication"
          count={ticket.comments.length}
          defaultOpen={false}
        >
          {ticket.comments.length > 0 && (
            <div className="max-h-64 overflow-y-auto mb-4 pr-2">
              <div className="space-y-4">
                {ticket.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`border-l-4 pl-4 ${
                      comment.isInternal
                        ? "border-orange-500 bg-orange-50 rounded-r-lg py-2 pr-2"
                        : "border-blue-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{comment.user.name}</p>
                        {comment.isInternal && canSeeInternal && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Internal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="border-t border-gray-200 pt-4">
            <div className="mb-3">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                {canSeeInternal && (
                  <label className="flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="mr-2 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-orange-600 font-medium">Internal note</span>
                    <span className="ml-1 text-gray-400">(hidden from customers)</span>
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={!newComment.trim() || submittingComment}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingComment ? "Sending..." : "Add Comment"}
              </button>
            </div>
          </form>
        </CollapsibleSection>
      </div>
    </div>
  );
}


