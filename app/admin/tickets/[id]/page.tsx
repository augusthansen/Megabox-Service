"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import HubSpotChatButton from "@/components/hubspot-chat-button";
import CommunicationRequestsManager from "@/components/communication-requests-manager";
import VideoCall from "@/components/video-call";

/**
 * Ticket Detail Page
 * 
 * View and manage an individual ticket with full details
 */

interface Session {
  id: string;
  sessionType: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  cost: number | null;
  callRecordingUrl: string | null;
  callTranscription: string | null;
  callResolutionStatus: string | null;
  notes: string | null;
  tech: {
    name: string;
  };
}

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  priority: string;
  status: string;
  machineDown: boolean;
  hubspotId: string | null;
  totalMinutes: number;
  totalCost: number;
  escalationFees: number;
  travelExpenses: number;
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
  sessions?: Session[];
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [startingVideoChat, setStartingVideoChat] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoomUrl, setVideoCallRoomUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "",
    status: "",
    machineDown: false,
    assignedToId: "",
    escalationFees: "0",
    travelExpenses: "0",
  });

  useEffect(() => {
    // Get current user from sessionStorage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }

    if (ticketId) {
      fetchTicket();
      fetchUsers();
    }
  }, [ticketId]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      console.log("Fetching ticket with ID:", ticketId);
      const response = await fetch(`/api/tickets/${ticketId}`);
      console.log("API Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Ticket data received:", data);
        setTicket(data);
        setFormData({
          subject: data.subject,
          description: data.description || "",
          priority: data.priority,
          status: data.status,
          machineDown: data.machineDown,
          assignedToId: data.assignedTo?.id || "",
          escalationFees: (data.escalationFees || 0).toString(),
          travelExpenses: (data.travelExpenses || 0).toString(),
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error("Failed to fetch ticket:", response.status, errorData);
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\nDetails: ${errorData.details}`
          : errorData.error || response.statusText || 'Unknown error';
        alert(`Failed to load ticket: ${errorMessage}\n\nCheck the browser console and server terminal for details.`);
        router.push("/admin/tickets");
      }
    } catch (error: any) {
      console.error("Error fetching ticket:", error);
      alert(`Error loading ticket: ${error.message || 'Unknown error'}\n\nCheck the browser console for details.`);
      router.push("/admin/tickets");
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

  const handleStartVideoChat = async () => {
    if (!currentUser || !ticket) return;

    setStartingVideoChat(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/video-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if we're on mobile (simple user agent check)
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
          // On mobile, open in a new window/tab for better video/audio support
          const roomUrl = data.meetingToken 
            ? `${data.roomUrl}?t=${data.meetingToken}` 
            : data.roomUrl;
          window.open(roomUrl, '_blank', 'noopener,noreferrer');
          setStartingVideoChat(false);
        } else {
          // On desktop, show in modal
          setVideoCallRoomUrl(JSON.stringify({
            roomUrl: data.roomUrl,
            roomName: data.roomName,
            meetingToken: data.meetingToken,
          }));
          setShowVideoCall(true);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        const errorMessage = errorData.error || errorData.details || "Failed to start video chat. Make sure DAILY_API_KEY is configured.";
        alert(`Error: ${errorMessage}`);
        setStartingVideoChat(false);
      }
    } catch (error: any) {
      console.error("Error starting video chat:", error);
      alert(`Failed to start video chat: ${error.message || "Unknown error"}`);
      setStartingVideoChat(false);
    }
  };

  const handleTransferTicket = async (newTechId: string) => {
    if (!ticket || !newTechId) return;

    setTransferring(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: newTechId,
          status: ticket.status === "open" ? "assigned" : ticket.status, // Auto-assign if open
        }),
      });

      if (response.ok) {
        alert("Ticket transferred successfully!");
        setShowTransferModal(false);
        fetchTicket(); // Refresh ticket data
      } else {
        const data = await response.json();
        alert(data.error || "Failed to transfer ticket");
      }
    } catch (error) {
      console.error("Error transferring ticket:", error);
      alert("Failed to transfer ticket. Please try again.");
    } finally {
      setTransferring(false);
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
          escalationFees: parseFloat(formData.escalationFees) || 0,
          travelExpenses: parseFloat(formData.travelExpenses) || 0,
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Buttons Group */}
          {!editing && currentUser && (currentUser.role === "service_tech" || currentUser.role === "super_admin") && ticket && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-1.5 border border-slate-200 shadow-sm">
              {/* Only show transfer button for admins */}
              {currentUser.role === "super_admin" && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-md border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all"
                  title="Transfer ticket to another tech"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transfer
                </button>
              )}
              <HubSpotChatButton
                hubId={process.env.NEXT_PUBLIC_HUBSPOT_HUB_ID || "242276679"}
                ticketId={ticket.id}
                user={{
                  id: currentUser.id,
                  email: currentUser.email,
                  name: currentUser.name,
                }}
                companyName={ticket.company?.name}
                ticketNumber={ticket.ticketNumber}
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 hover:shadow-md transition-all"
              />
              <button
                onClick={handleStartVideoChat}
                disabled={startingVideoChat}
                className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-success-600 rounded-md hover:bg-success-700 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md transition-all"
              >
                {startingVideoChat ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Starting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Video Call
                  </>
                )}
              </button>
            </div>
          )}
          {/* HubSpot Link */}
          {ticket.hubspotId && (
            <a
              href={`https://app.hubspot.com/contacts/ticket/${ticket.hubspotId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50 hover:border-slate-400 hover:shadow-md transition-all"
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
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 hover:shadow-md transition-all"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="escalationFees" className="block text-sm font-medium text-slate-700 mb-2">
                    Escalation Fees ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="escalationFees"
                    value={formData.escalationFees}
                    onChange={(e) => setFormData({ ...formData, escalationFees: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Additional fees for escalated tickets
                  </p>
                </div>
                <div>
                  <label htmlFor="travelExpenses" className="block text-sm font-medium text-slate-700 mb-2">
                    Travel Expenses ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="travelExpenses"
                    value={formData.travelExpenses}
                    onChange={(e) => setFormData({ ...formData, travelExpenses: e.target.value })}
                    className="input"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Travel costs for on-site visits
                  </p>
                </div>
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
                      escalationFees: (ticket.escalationFees || 0).toString(),
                      travelExpenses: (ticket.travelExpenses || 0).toString(),
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

          {/* Communication Requests */}
          {ticket.assignedTo && currentUser && (
            <div className="card p-6">
              <CommunicationRequestsManager
                ticketId={ticket.id}
                techId={currentUser.id}
                onRequestUpdated={() => {
                  fetchTicket(); // Refresh ticket data
                }}
              />
            </div>
          )}

          {/* Time Tracking */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">
              {currentUser?.role === "service_tech" ? "Time Tracking" : "Time & Cost"}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Total Time</p>
                <p className="text-sm font-medium text-slate-900">
                  {ticket.totalMinutes || 0} minutes
                </p>
              </div>
              {/* Only show cost for admins */}
              {currentUser?.role !== "service_tech" && (
                <>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Total Cost</p>
                    <p className="text-sm font-medium text-slate-900">
                      ${Number(ticket.totalCost || 0).toFixed(2)}
                    </p>
                  </div>
                  {(ticket.escalationFees > 0 || ticket.travelExpenses > 0) && (
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      {ticket.escalationFees > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Escalation Fees</p>
                          <p className="text-sm font-medium text-slate-900">
                            ${Number(ticket.escalationFees || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                      {ticket.travelExpenses > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Travel Expenses</p>
                          <p className="text-sm font-medium text-slate-900">
                            ${Number(ticket.travelExpenses || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
              {ticket.sessions && ticket.sessions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Recent Sessions</p>
                  <div className="space-y-2">
                    {ticket.sessions
                      .filter((s) => s.sessionType === "chat")
                      .map((session) => (
                        <div key={session.id} className="text-xs">
                          <span className="font-medium text-slate-700">Chat:</span>{" "}
                          <span className="text-slate-600">
                            {session.durationMinutes || 0} min
                            {currentUser?.role !== "service_tech" && session.cost && ` ($${Number(session.cost).toFixed(2)})`}
                          </span>
                          <span className="text-slate-400 ml-2">
                            {new Date(session.startTime).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    {ticket.sessions
                      .filter((s) => s.sessionType !== "chat")
                      .map((session) => (
                        <div key={session.id} className="text-xs border-l-2 border-slate-200 pl-2 py-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-slate-700 capitalize">
                                {session.sessionType.replace("_", " ")}:
                              </span>{" "}
                              <span className="text-slate-600">
                                {session.durationMinutes || 0} min
                                {currentUser?.role !== "service_tech" && session.cost && ` ($${Number(session.cost).toFixed(2)})`}
                              </span>
                              <span className="text-slate-400 ml-2">
                                {new Date(session.startTime).toLocaleDateString()}
                              </span>
                            </div>
                            {session.sessionType === "phone_call" && 
                             session.callRecordingUrl && 
                             currentUser && 
                             (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
                              <a
                                href={session.callRecordingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 underline text-xs ml-2"
                                title="Listen to recording"
                              >
                                🎧 Recording
                              </a>
                            )}
                          </div>
                          {session.sessionType === "phone_call" && 
                           session.callResolutionStatus && 
                           currentUser && 
                           (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
                            <div className="mt-1">
                              <span className="text-slate-500">Status: </span>
                              <span className={`font-medium ${
                                session.callResolutionStatus === "resolved" ? "text-green-600" :
                                session.callResolutionStatus === "ongoing" ? "text-yellow-600" :
                                "text-orange-600"
                              }`}>
                                {session.callResolutionStatus.replace("_", " ")}
                              </span>
                            </div>
                          )}
                          {session.sessionType === "phone_call" && 
                           session.callTranscription && 
                           currentUser && 
                           (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
                            <details className="mt-1">
                              <summary className="text-primary-600 hover:text-primary-700 cursor-pointer text-xs">
                                View Transcription
                              </summary>
                              <div className="mt-1 p-2 bg-slate-50 rounded text-xs text-slate-700 max-h-32 overflow-y-auto">
                                {session.callTranscription}
                              </div>
                            </details>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Location & Asset */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Location & Asset</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Customer</p>
                {currentUser?.role === "service_tech" ? (
                  <p className="text-sm font-medium text-slate-900">
                    {ticket.company.name}
                  </p>
                ) : (
                  <Link
                    href={`/admin/customers/${ticket.company.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {ticket.company.name}
                  </Link>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Site</p>
                {currentUser?.role === "service_tech" ? (
                  <p className="text-sm font-medium text-slate-900">
                    {ticket.site.name}
                  </p>
                ) : (
                  <Link
                    href={`/admin/sites/${ticket.site.id}`}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    {ticket.site.name}
                  </Link>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Machine</p>
                {ticket.machine ? (
                  currentUser?.role === "service_tech" ? (
                    <p className="text-sm font-medium text-slate-900">
                      {ticket.machine.name}
                      {ticket.machine.serialNumber && (
                        <span className="text-slate-500"> (SN: {ticket.machine.serialNumber})</span>
                      )}
                    </p>
                  ) : (
                    <Link
                      href={`/admin/machines/${ticket.machine.id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      {ticket.machine.name}
                      {ticket.machine.serialNumber && (
                        <span className="text-slate-500"> (SN: {ticket.machine.serialNumber})</span>
                      )}
                    </Link>
                  )
                ) : (
                  <p className="text-sm text-slate-500">No machine specified</p>
                )}
              </div>
              {/* Show main contact for service techs */}
              {currentUser?.role === "service_tech" && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Main Contact</p>
                  <p className="text-sm font-medium text-slate-900">
                    {ticket.createdBy.name}
                  </p>
                </div>
              )}
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

      {/* Transfer Ticket Modal */}
      {showTransferModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900">Transfer Ticket</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-600 mb-4">
              Transfer ticket <span className="font-mono font-semibold">{ticket.ticketNumber}</span> to another technician.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select Technician
              </label>
              <select
                id="transferTech"
                className="input"
                onChange={(e) => {
                  if (e.target.value) {
                    handleTransferTicket(e.target.value);
                  }
                }}
                disabled={transferring}
              >
                <option value="">-- Select a technician --</option>
                {users
                  .filter((u) => u.id !== ticket.assignedTo?.id) // Don't show current assignee
                  .map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
              </select>
            </div>
            {transferring && (
              <div className="text-center py-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-slate-500 mt-2">Transferring...</p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="btn-secondary"
                disabled={transferring}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Call Modal */}
      {showVideoCall && videoCallRoomUrl && currentUser && (() => {
        try {
          const roomData = JSON.parse(videoCallRoomUrl);
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col m-2 sm:m-0">
                <VideoCall
                  roomUrl={roomData.roomUrl}
                  roomName={roomData.roomName}
                  meetingToken={roomData.meetingToken}
                  userName={currentUser.name}
                  userId={currentUser.id}
                  onLeave={() => {
                    setShowVideoCall(false);
                    setVideoCallRoomUrl(null);
                  }}
                />
              </div>
            </div>
          );
        } catch (e) {
          // Fallback if JSON parsing fails (backwards compatibility)
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[95vh] sm:h-[90vh] flex flex-col m-2 sm:m-0">
                <VideoCall
                  roomUrl={videoCallRoomUrl}
                  userName={currentUser.name}
                  userId={currentUser.id}
                  onLeave={() => {
                    setShowVideoCall(false);
                    setVideoCallRoomUrl(null);
                  }}
                />
              </div>
            </div>
          );
        }
      })()}
    </div>
  );
}
