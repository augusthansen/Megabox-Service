"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import CommunicationRequestsManager from "@/components/communication-requests-manager";
import VideoCall from "@/components/video-call";
import dynamic from "next/dynamic";

const ChatWindow = dynamic(() => import("@/components/chat/ChatWindow"), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 h-[400px] flex items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">Loading chat...</p>
    </div>
  ),
});

const KnowledgeChat = dynamic(() => import("@/components/knowledge-base/KnowledgeChat"), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 h-[400px] flex items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">Loading knowledge base...</p>
    </div>
  ),
});

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
  resolutionNotes: string | null;
  resolutionCategory: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
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

interface ActivityLog {
  id: string;
  actorName: string;
  activityType: string;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
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
  const [isTimeTrackingExpanded, setIsTimeTrackingExpanded] = useState(false);
  const [showAllSessions, setShowAllSessions] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isKnowledgeBaseExpanded, setIsKnowledgeBaseExpanded] = useState(false);
  const [isActivityExpanded, setIsActivityExpanded] = useState(false);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  // Resolution modal state
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolutionCategory, setResolutionCategory] = useState("fixed");
  const [submittingResolution, setSubmittingResolution] = useState(false);
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
          escalationFees: (data.escalationFees || 0).toString(),
          travelExpenses: (data.travelExpenses || 0).toString(),
        });
      } else {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        console.error("Failed to fetch ticket:", errorData);
        alert(`Failed to load ticket: ${errorData.error || "Unknown error"}`);
        router.push("/admin/tickets");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
      alert("Error loading ticket. Please try again.");
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

  const fetchActivityLog = async () => {
    if (!ticketId) return;
    try {
      setLoadingActivity(true);
      const response = await fetch(`/api/tickets/${ticketId}/activity`);
      if (response.ok) {
        const data = await response.json();
        setActivityLog(data);
      }
    } catch (error) {
      console.error("Error fetching activity log:", error);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Fetch activity log when expanded
  useEffect(() => {
    if (isActivityExpanded && activityLog.length === 0) {
      fetchActivityLog();
    }
  }, [isActivityExpanded]);

  const handleResolveWithNotes = async () => {
    if (!resolutionNotes.trim()) {
      alert("Please enter resolution notes describing what was done to fix the issue.");
      return;
    }

    setSubmittingResolution(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          resolutionNotes: resolutionNotes,
          resolutionCategory: resolutionCategory,
          actorId: currentUser?.id,
          actorName: currentUser?.name || "Unknown",
        }),
      });

      if (response.ok) {
        setShowResolutionModal(false);
        setResolutionNotes("");
        setResolutionCategory("fixed");
        fetchTicket();
        fetchActivityLog(); // Refresh activity log
      } else {
        const data = await response.json();
        alert(data.error || "Failed to resolve ticket");
      }
    } catch (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket");
    } finally {
      setSubmittingResolution(false);
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
        <p className="text-slate-500 dark:text-slate-400">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">Ticket not found</p>
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
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Ticket #{ticket.ticketNumber}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Created {new Date(ticket.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Action Buttons Group */}
          {!editing && currentUser && (currentUser.role === "service_tech" || currentUser.role === "super_admin") && ticket && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg p-1.5 border border-slate-200 dark:border-slate-600 shadow-sm">
              {/* Only show transfer button for admins */}
              {currentUser.role === "super_admin" && (
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
                  title="Transfer ticket to another tech"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  Transfer
                </button>
              )}
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
              className="flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md transition-all"
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

      {/* Quick Status Actions - Always visible for service techs */}
      {!editing && currentUser && (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</span>
              <span className={`badge ${statusBadges[ticket.status as keyof typeof statusBadges] || "badge-neutral"}`}>
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Start Work Button - shown when status is open or assigned */}
              {(ticket.status === "open" || ticket.status === "assigned") && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "in_progress" }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Work
                </button>
              )}

              {/* Put On Hold Button - shown when in_progress */}
              {ticket.status === "in_progress" && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "on_hold" }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Put On Hold
                </button>
              )}

              {/* Resume Button - shown when on_hold */}
              {ticket.status === "on_hold" && (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "in_progress" }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resume Work
                </button>
              )}

              {/* Mark Resolved Button - shown when in_progress or on_hold */}
              {(ticket.status === "in_progress" || ticket.status === "on_hold") && (
                <button
                  onClick={() => setShowResolutionModal(true)}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark Resolved
                </button>
              )}

              {/* Close Ticket Button - shown when resolved (admin only) */}
              {ticket.status === "resolved" && currentUser.role === "super_admin" && (
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to close this ticket? This typically means the work is complete and billed.")) return;
                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "closed" }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-lg hover:bg-slate-700 transition-all shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Close Ticket
                </button>
              )}

              {/* Reopen Ticket Button - shown when closed (admin only) */}
              {ticket.status === "closed" && currentUser.role === "super_admin" && (
                <button
                  onClick={async () => {
                    if (!confirm("Are you sure you want to reopen this ticket?")) return;
                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "open" }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="flex items-center px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reopen Ticket
                </button>
              )}

              {/* Status dropdown for more options */}
              <div className="relative">
                <select
                  value={ticket.status}
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    if (newStatus === ticket.status) return;

                    try {
                      const response = await fetch(`/api/tickets/${ticketId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: newStatus }),
                      });
                      if (response.ok) {
                        fetchTicket();
                      } else {
                        const data = await response.json();
                        alert(data.error || "Failed to update status");
                      }
                    } catch (error) {
                      console.error("Error updating status:", error);
                      alert("Failed to update status");
                    }
                  }}
                  className="appearance-none pl-3 pr-8 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="on_hold">On Hold</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <svg className="w-4 h-4 absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Ticket Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information */}
          {editing ? (
            <form onSubmit={handleUpdate} className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Edit Ticket</h2>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <label htmlFor="assignedTo" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 dark:border-slate-600 rounded mr-2"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Machine is down</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="escalationFees" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Additional fees for escalated tickets
                  </p>
                </div>
                <div>
                  <label htmlFor="travelExpenses" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Travel costs for on-site visits
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-700">
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
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
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

              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {ticket.description || "No description provided."}
                </p>
              </div>
            </div>
          )}

          {/* Live Chat Section - Collapsible */}
          {currentUser && (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
            <div className="card overflow-hidden">
              {/* Chat Header - Always visible */}
              <button
                onClick={() => setIsChatExpanded(!isChatExpanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Live Chat</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Communicate with the customer in real-time</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isChatExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Chat Window - Collapsible Content */}
              {isChatExpanded && (
                <div className="h-[500px]">
                  <ChatWindow
                    ticketId={ticket.id}
                    currentUserId={currentUser.id}
                    currentUserName={currentUser.name}
                    ticketNumber={ticket.ticketNumber}
                    embedded={true}
                  />
                </div>
              )}
            </div>
          )}

          {/* Knowledge Base AI Assistant - Collapsible */}
          {currentUser && (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
            <div className="card overflow-hidden">
              {/* Knowledge Base Header - Always visible */}
              <button
                onClick={() => setIsKnowledgeBaseExpanded(!isKnowledgeBaseExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 border-b border-indigo-200 dark:border-indigo-800 hover:from-indigo-100 hover:to-blue-100 dark:hover:from-indigo-900/50 dark:hover:to-blue-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Knowledge Base AI</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Search manuals and get AI-powered answers</p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isKnowledgeBaseExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Knowledge Base Chat - Collapsible Content */}
              {isKnowledgeBaseExpanded && (
                <div className="h-[500px]">
                  <KnowledgeChat
                    userId={currentUser.id}
                    userName={currentUser.name}
                    ticketId={ticket.id}
                    machineModel={ticket.machine?.name}
                    embedded={true}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Assignment */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Assignment</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created By</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{ticket.createdBy.name}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Assigned To</p>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
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

          {/* Time Tracking - Collapsible */}
          <div className="card p-6">
            {/* Collapsible Header */}
            <button
              onClick={() => setIsTimeTrackingExpanded(!isTimeTrackingExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isTimeTrackingExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {currentUser?.role === "service_tech" ? "Time Tracking" : "Time & Cost"}
                  {ticket.sessions && ticket.sessions.length > 0 && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal ml-1">
                      ({ticket.sessions.length} session{ticket.sessions.length !== 1 ? 's' : ''})
                    </span>
                  )}
                </h3>
              </div>
              {/* Summary when collapsed */}
              {!isTimeTrackingExpanded && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {ticket.totalMinutes || 0} min
                  </span>
                  {currentUser?.role !== "service_tech" && (
                    <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      ${Number(ticket.totalCost || 0).toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Collapsible Content */}
            {isTimeTrackingExpanded && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Time</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.totalMinutes || 0} minutes
                  </p>
                </div>
                {/* Only show cost for admins */}
                {currentUser?.role !== "service_tech" && (
                  <>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Cost</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        ${Number(ticket.totalCost || 0).toFixed(2)}
                      </p>
                    </div>
                    {(ticket.escalationFees > 0 || ticket.travelExpenses > 0) && (
                      <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        {ticket.escalationFees > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Escalation Fees</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              ${Number(ticket.escalationFees || 0).toFixed(2)}
                            </p>
                          </div>
                        )}
                        {ticket.travelExpenses > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Travel Expenses</p>
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              ${Number(ticket.travelExpenses || 0).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {ticket.sessions && ticket.sessions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Sessions</p>
                    <div className="space-y-2">
                      {(showAllSessions ? ticket.sessions : ticket.sessions.slice(0, 3))
                        .filter((s) => s.sessionType === "chat")
                        .map((session) => (
                          <div key={session.id} className="text-xs">
                            <span className="font-medium text-slate-700 dark:text-slate-300">Chat:</span>{" "}
                            <span className="text-slate-600 dark:text-slate-400">
                              {session.durationMinutes || 0} min
                              {currentUser?.role !== "service_tech" && session.cost && ` ($${Number(session.cost).toFixed(2)})`}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500 ml-2">
                              {new Date(session.startTime).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      {(showAllSessions ? ticket.sessions : ticket.sessions.slice(0, 3))
                        .filter((s) => s.sessionType !== "chat")
                        .map((session) => (
                          <div key={session.id} className="text-xs border-l-2 border-slate-200 dark:border-slate-600 pl-2 py-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">
                                  {session.sessionType.replace("_", " ")}:
                                </span>{" "}
                                <span className="text-slate-600 dark:text-slate-400">
                                  {session.durationMinutes || 0} min
                                  {currentUser?.role !== "service_tech" && session.cost && ` ($${Number(session.cost).toFixed(2)})`}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 ml-2">
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
                                  Recording
                                </a>
                              )}
                            </div>
                            {session.sessionType === "phone_call" &&
                             session.callResolutionStatus &&
                             currentUser &&
                             (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
                              <div className="mt-1">
                                <span className="text-slate-500 dark:text-slate-400">Status: </span>
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
                                <summary className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer text-xs">
                                  View Transcription
                                </summary>
                                <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-700 rounded text-xs text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto">
                                  {session.callTranscription}
                                </div>
                              </details>
                            )}
                          </div>
                        ))}
                    </div>
                    {/* Show More / Show Less for sessions */}
                    {ticket.sessions.length > 3 && (
                      <button
                        onClick={() => setShowAllSessions(!showAllSessions)}
                        className="w-full mt-3 py-2 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
                      >
                        {showAllSessions ? (
                          <span className="flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Show Less
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show {ticket.sessions.length - 3} More Sessions
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location & Asset */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Location & Asset</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Customer</p>
                {currentUser?.role === "service_tech" ? (
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.company.name}
                  </p>
                ) : (
                  <Link
                    href={`/admin/customers/${ticket.company.id}`}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {ticket.company.name}
                  </Link>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Site</p>
                {currentUser?.role === "service_tech" ? (
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.site.name}
                  </p>
                ) : (
                  <Link
                    href={`/admin/sites/${ticket.site.id}`}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    {ticket.site.name}
                  </Link>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Machine</p>
                {ticket.machine ? (
                  currentUser?.role === "service_tech" ? (
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {ticket.machine.name}
                      {ticket.machine.serialNumber && (
                        <span className="text-slate-500 dark:text-slate-400"> (SN: {ticket.machine.serialNumber})</span>
                      )}
                    </p>
                  ) : (
                    <Link
                      href={`/admin/machines/${ticket.machine.id}`}
                      className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      {ticket.machine.name}
                      {ticket.machine.serialNumber && (
                        <span className="text-slate-500 dark:text-slate-400"> (SN: {ticket.machine.serialNumber})</span>
                      )}
                    </Link>
                  )
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No machine specified</p>
                )}
              </div>
              {/* Show main contact for service techs */}
              {currentUser?.role === "service_tech" && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Main Contact</p>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {ticket.createdBy.name}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Timestamps</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Created</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Last Updated</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Resolution Notes - shown if ticket is resolved/closed */}
          {ticket.resolutionNotes && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Resolution</h3>
              <div className="space-y-3">
                {ticket.resolutionCategory && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Category</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 capitalize">
                      {ticket.resolutionCategory.replace("_", " ")}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Resolution Notes</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                    {ticket.resolutionNotes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Satisfaction - shown if rated */}
          {ticket.satisfactionRating && (
            <div className="card p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Customer Feedback</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-5 h-5 ${star <= ticket.satisfactionRating! ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                  <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
                    {ticket.satisfactionRating}/5
                  </span>
                </div>
                {ticket.satisfactionFeedback && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Feedback</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">
                      "{ticket.satisfactionFeedback}"
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log - Collapsible */}
          <div className="card p-6">
            <button
              onClick={() => setIsActivityExpanded(!isActivityExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <svg
                  className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isActivityExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity History</h3>
              </div>
              {!isActivityExpanded && activityLog.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{activityLog.length} events</span>
              )}
            </button>

            {isActivityExpanded && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {loadingActivity ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                    <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading activity...</span>
                  </div>
                ) : activityLog.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No activity recorded yet</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {activityLog.map((activity) => (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          {activity.activityType === "status_change" && (
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {activity.activityType === "priority_change" && (
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                          {activity.activityType === "assignment_change" && (
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                          {activity.activityType === "chat_message" && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          )}
                          {activity.activityType === "resolution_added" && (
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                          {activity.activityType === "satisfaction_rated" && (
                            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          )}
                          {!["status_change", "priority_change", "assignment_change", "chat_message", "resolution_added", "satisfaction_rated"].includes(activity.activityType) && (
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 dark:text-white">{activity.description}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {activity.actorName} • {new Date(activity.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Ticket Modal */}
      {showTransferModal && ticket && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Transfer Ticket</h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Transfer ticket <span className="font-mono font-semibold">{ticket.ticketNumber}</span> to another technician.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
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
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Transferring...</p>
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

      {/* Resolution Modal */}
      {showResolutionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Resolve Ticket</h3>
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionNotes("");
                  setResolutionCategory("fixed");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please provide details about how this ticket was resolved. This information helps track solutions and improve future support.
            </p>

            <div className="space-y-4">
              {/* Resolution Category */}
              <div>
                <label htmlFor="resolutionCategory" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Resolution Category
                </label>
                <select
                  id="resolutionCategory"
                  value={resolutionCategory}
                  onChange={(e) => setResolutionCategory(e.target.value)}
                  className="input"
                >
                  <option value="fixed">Fixed - Issue resolved permanently</option>
                  <option value="workaround">Workaround - Temporary solution provided</option>
                  <option value="training">Training - Customer trained on proper usage</option>
                  <option value="configuration">Configuration - Settings adjusted</option>
                  <option value="replacement">Replacement - Part/component replaced</option>
                  <option value="escalated">Escalated - Sent to manufacturer/specialist</option>
                  <option value="not_reproducible">Not Reproducible - Could not replicate issue</option>
                  <option value="user_error">User Error - Issue caused by incorrect usage</option>
                  <option value="no_issue">No Issue Found - Equipment working correctly</option>
                </select>
              </div>

              {/* Resolution Notes */}
              <div>
                <label htmlFor="resolutionNotes" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Resolution Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe what was done to resolve the issue, any parts used, steps taken, etc."
                  className="input min-h-[120px]"
                  rows={5}
                  required
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Be specific about the actions taken. This helps with future similar issues.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setShowResolutionModal(false);
                  setResolutionNotes("");
                  setResolutionCategory("fixed");
                }}
                className="btn-secondary"
                disabled={submittingResolution}
              >
                Cancel
              </button>
              <button
                onClick={handleResolveWithNotes}
                disabled={submittingResolution || !resolutionNotes.trim()}
                className="btn-primary flex items-center"
              >
                {submittingResolution ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resolving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Resolved
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
