"use client";

import { useEffect, useState, useRef } from "react";
import TwilioCalling from "./twilio-calling";

const INITIAL_VISIBLE_COUNT = 3;

interface CommunicationRequest {
  id: string;
  requestType: "video_call" | "phone_call" | "chat";
  status: string;
  scheduledTime: string | null;
  customerPhone: string | null;
  notes: string | null;
  techNotes: string | null;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  ticket?: {
    id: string;
    ticketNumber: string;
    subject: string;
  };
  session: {
    id: string;
    startTime: string;
    endTime: string | null;
    durationMinutes: number | null;
    cost: number | null;
    videoRecordingUrl: string | null;
    callRecordingUrl: string | null;
    callRecordingSid: string | null;
    callTranscription: string | null;
    callResolutionStatus: string | null;
    notes: string | null;
  } | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
}

interface CommunicationRequestsManagerProps {
  ticketId: string;
  techId: string;
  onRequestUpdated?: () => void;
}

export default function CommunicationRequestsManager({
  ticketId,
  techId,
  onRequestUpdated,
}: CommunicationRequestsManagerProps) {
  const [requests, setRequests] = useState<CommunicationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string; name: string; email: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    // Get current user from sessionStorage to check role
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CommunicationRequest | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [techNotes, setTechNotes] = useState("");
  const [showCallingModal, setShowCallingModal] = useState(false);
  const [callingPhoneNumber, setCallingPhoneNumber] = useState<string | null>(null);
  const [callingContactName, setCallingContactName] = useState<string | undefined>(undefined);
  const [callingTicketNumber, setCallingTicketNumber] = useState<string | undefined>(undefined);
  const [callingContactId, setCallingContactId] = useState<string | undefined>(undefined);
  const [activeCallRequestId, setActiveCallRequestId] = useState<string | null>(null); // Track which request is being called
  
  // Use refs to preserve modal state during re-renders
  const modalStateRef = useRef({ 
    phoneNumber: null as string | null, 
    contactName: undefined as string | undefined, 
    ticketNumber: undefined as string | undefined,
    contactId: undefined as string | undefined,
  });

  useEffect(() => {
    fetchRequests();
  }, [ticketId]);

  // Re-fetch requests when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchRequests();
    }
  }, [currentUser]);

  // Debug: Log modal state changes
  useEffect(() => {
    console.log("🔍 Modal state changed:", {
      showCallingModal,
      callingPhoneNumber,
      callingContactName,
      callingTicketNumber,
    });
  }, [showCallingModal, callingPhoneNumber, callingContactName, callingTicketNumber]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/communication-requests?ticketId=${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        console.log("📞 Communication requests fetched:", data);
        // Log phone call requests with sessions
        data.forEach((req: CommunicationRequest) => {
          if (req.requestType === "phone_call") {
            console.log("📞 Phone call request:", {
              id: req.id,
              status: req.status,
              hasSession: !!req.session,
              session: req.session,
              currentUser: currentUser,
            });
          }
        });
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching communication requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: string, scheduledTime?: string) => {
    try {
      const response = await fetch(`/api/communication-requests/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          scheduledTime,
          techNotes: techNotes || undefined,
        }),
      });

      if (response.ok) {
        fetchRequests();
        setShowScheduleModal(false);
        setSelectedRequest(null);
        setScheduledTime("");
        setTechNotes("");
        if (onRequestUpdated) {
          onRequestUpdated();
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("Error updating communication request:", errorData);
        alert(`${errorData.error || "Failed to update request"}${errorData.details ? `\n\nDetails: ${errorData.details}` : ""}`);
      }
    } catch (error) {
      console.error("Error updating communication request:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const initiateHubSpotCall = async (request: CommunicationRequest, phoneNumber: string) => {
    try {
      // Log the call initiation to HubSpot
      const response = await fetch("/api/calls/hubspot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          phoneNumber,
          techId,
          contactId: request.requestedBy.id, // Use requestedBy as contact
          direction: "OUTBOUND",
        }),
      });

      if (response.ok) {
        // Show the embedded calling interface
        setCallingPhoneNumber(phoneNumber);
        setCallingContactId(request.requestedBy.id);
        setCallingTicketNumber(request.ticket?.ticketNumber);
        setShowCallingModal(true);
      } else {
        const errorData = await response.json();
        console.error("Error initiating HubSpot call:", errorData);
        // Fallback to tel: link
        window.location.href = `tel:${phoneNumber}`;
      }
    } catch (error) {
      console.error("Error initiating HubSpot call:", error);
      // Fallback to tel: link
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const handleCallEnd = async (duration?: number) => {
    // Call ended - automatically complete the communication request and update session
    console.log("[CommunicationRequestsManager] Call ended with duration:", duration);
    
    // Automatically mark the communication request as completed
    if (activeCallRequestId) {
      try {
        console.log("[CommunicationRequestsManager] Auto-completing communication request:", activeCallRequestId);
        const completeResponse = await fetch(`/api/communication-requests/${activeCallRequestId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "complete",
          }),
        });
        
        if (completeResponse.ok) {
          console.log("[CommunicationRequestsManager] Communication request auto-completed successfully");
        } else {
          const errorData = await completeResponse.json().catch(() => ({}));
          console.error("[CommunicationRequestsManager] Error auto-completing request:", errorData);
        }
      } catch (error) {
        console.error("[CommunicationRequestsManager] Error auto-completing communication request:", error);
      }
    }
    
    // Log the call to HubSpot if we have the data
    const contactIdToUse = callingContactId || modalStateRef.current.contactId;
    const phoneNumberToUse = callingPhoneNumber || modalStateRef.current.phoneNumber;
    
    if (phoneNumberToUse && duration && contactIdToUse) {
      try {
        console.log("[CommunicationRequestsManager] Logging call to HubSpot:", {
          ticketId,
          phoneNumber: phoneNumberToUse,
          techId,
          contactId: contactIdToUse,
          duration,
        });
        
        const response = await fetch("/api/calls/hubspot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ticketId,
            phoneNumber: phoneNumberToUse,
            techId,
            contactId: contactIdToUse,
            direction: "OUTBOUND",
            duration: duration,
          }),
        });
        
        if (response.ok) {
          console.log("[CommunicationRequestsManager] Call logged to HubSpot successfully");
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error("[CommunicationRequestsManager] Error logging call to HubSpot:", errorData);
        }
      } catch (error) {
        console.error("[CommunicationRequestsManager] Error logging call to HubSpot:", error);
      }
    } else {
      console.warn("[CommunicationRequestsManager] Missing data for HubSpot logging:", {
        phoneNumber: phoneNumberToUse,
        duration,
        contactId: contactIdToUse,
      });
    }
    
    setShowCallingModal(false);
    setCallingPhoneNumber(null);
    setCallingContactName(undefined);
    setCallingTicketNumber(undefined);
    setCallingContactId(undefined);
    setActiveCallRequestId(null);
    modalStateRef.current = { phoneNumber: null, contactName: undefined, ticketNumber: undefined, contactId: undefined };
    
    // Refresh requests to update status
    fetchRequests();
    if (onRequestUpdated) {
      onRequestUpdated();
    }
  };

  const handleStartCall = async (request: CommunicationRequest) => {
    console.log("🚀 Starting call for request:", request);
    
    try {
      // Start the session
      console.log("📞 Calling API to start session...");
      const response = await fetch(`/api/communication-requests/${request.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start",
        }),
      });

      console.log("📡 API Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ API Response data:", data);
        
        // Automatically initiate the call based on type BEFORE refreshing requests
        console.log("🔍 Checking for auto-initiate data...");
        console.log("Full response data:", JSON.stringify(data, null, 2));
        
        if (data._autoInitiate) {
          console.log("🎯 Auto-initiate data found:", data._autoInitiate);
          const { requestType, videoRecordingUrl, customerPhone } = data._autoInitiate;
          console.log("📋 Extracted values:", { requestType, videoRecordingUrl, customerPhone });

          if (requestType === "video_call" && videoRecordingUrl) {
            // Check if we're on mobile
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
              // On mobile, open in a new window/tab for better video/audio support
              window.open(videoRecordingUrl, '_blank', 'noopener,noreferrer');
            } else {
              // On desktop, open in a popup window
              window.open(videoRecordingUrl, "_blank", "width=1200,height=800");
            }
          } else if (requestType === "phone_call" && customerPhone) {
            console.log("📱 Phone call detected, phone number:", customerPhone);
            console.log("👤 Contact name:", request.requestedBy.name);
            console.log("🎫 Ticket number:", request.ticket?.ticketNumber);
            // Show Twilio calling interface - set state and preserve in ref
            console.log("🔧 Setting modal state...");
            modalStateRef.current = {
              phoneNumber: customerPhone,
              contactName: request.requestedBy.name,
              ticketNumber: request.ticket?.ticketNumber,
              contactId: request.requestedBy.id,
            };
            setCallingPhoneNumber(customerPhone);
            setCallingContactName(request.requestedBy.name);
            setCallingTicketNumber(request.ticket?.ticketNumber);
            setCallingContactId(request.requestedBy.id);
            setActiveCallRequestId(request.id); // Track which request is being called
            // Use double requestAnimationFrame to ensure state is set after all renders
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setShowCallingModal(true);
                console.log("✅ Modal state set - should be visible now");
                console.log("Modal will show:", { 
                  showCallingModal: true, 
                  callingPhoneNumber: customerPhone,
                  callingContactName: request.requestedBy.name 
                });
              });
            });
          } else if (requestType === "chat") {
            // Open HubSpot chat widget
            if (typeof window !== 'undefined' && window.HubSpotConversations?.widget) {
              window.HubSpotConversations.widget.load();
              window.HubSpotConversations.widget.open();
            } else {
              alert("Chat is not available. Please make sure HubSpot chat is configured.");
            }
          } else {
            console.warn("⚠️ No auto-initiate data or missing phone number:", { requestType, customerPhone });
          }
        } else if (request.requestType === "video_call" && request.session?.videoRecordingUrl) {
          console.log("📹 Video call fallback - opening existing session");
          // Fallback: if session already exists, open it
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            window.open(request.session.videoRecordingUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.open(request.session.videoRecordingUrl, "_blank", "width=1200,height=800");
          }
        } else {
          console.warn("⚠️ No auto-initiate data and no fallback available");
          console.log("Request data:", request);
          console.log("Response data:", data);
          console.log("Request type:", request.requestType);
          console.log("Customer phone:", request.customerPhone);
          console.log("Session:", request.session);
          
          // Try to use request data directly as fallback
          if (request.requestType === "phone_call" && request.customerPhone) {
            console.log("🔄 Using fallback: initiating call directly from request data");
            console.log("🔧 Setting modal state (fallback)...");
            modalStateRef.current = {
              phoneNumber: request.customerPhone,
              contactName: request.requestedBy.name,
              ticketNumber: request.ticket?.ticketNumber,
              contactId: request.requestedBy.id,
            };
            setCallingPhoneNumber(request.customerPhone);
            setCallingContactName(request.requestedBy.name);
            setCallingTicketNumber(request.ticket?.ticketNumber);
            setCallingContactId(request.requestedBy.id);
            setActiveCallRequestId(request.id); // Track which request is being called
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setShowCallingModal(true);
                console.log("✅ Modal state set (fallback) - should be visible now");
              });
            });
          } else {
            alert(`Unable to initiate call. Missing ${!request.customerPhone ? 'phone number' : 'request type'}. Check console for details.`);
          }
        }
        
        // Don't refresh requests immediately - wait until modal is closed
        // This prevents the re-render from closing the modal
        // The requests will be refreshed when the modal closes or when handleCallEnd is called
      } else {
        const errorData = await response.json();
        console.error("❌ API Error:", errorData);
        alert(errorData.error || "Failed to start call. Check console for details.");
      }
    } catch (error) {
      console.error("❌ Error starting call:", error);
      alert(`Error: ${error instanceof Error ? error.message : "Something went wrong. Please try again."}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700",
      accepted: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
      scheduled: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
      in_progress: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
      completed: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-600 dark:text-slate-300 dark:border-slate-500",
      declined: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700",
      cancelled: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600",
    };
    return badges[status] || badges.pending;
  };

  const getTypeIcon = (type: string) => {
    if (type === "video_call") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else if (type === "phone_call") {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    }
  };

  // Calculate summary stats
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const inProgressCount = requests.filter(r => r.status === "in_progress" || r.status === "scheduled" || r.status === "accepted").length;
  const completedCount = requests.filter(r => r.status === "completed").length;

  // Determine which requests to show
  const visibleRequests = showAll ? requests : requests.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = requests.length > INITIAL_VISIBLE_COUNT;

  if (loading) {
    return <div className="text-slate-500 dark:text-slate-400 text-sm">Loading communication requests...</div>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
        No communication requests for this ticket
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Communication Requests ({requests.length})
          </h3>
        </div>
        {/* Summary badges when collapsed */}
        {!isExpanded && (
          <div className="flex items-center gap-2">
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {pendingCount} pending
              </span>
            )}
            {inProgressCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {inProgressCount} active
              </span>
            )}
          </div>
        )}
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="space-y-3 pt-2">
          {visibleRequests.map((request) => (
        <div key={request.id} className="card p-4 border-l-4 border-l-primary-500 dark:bg-slate-700 dark:border-slate-600">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-primary-600 dark:text-primary-400">{getTypeIcon(request.requestType)}</div>
              <div>
                <div className="font-semibold text-slate-900 dark:text-white capitalize">
                  {request.requestType.replace("_", " ")} Request
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  From: {request.requestedBy.name}
                </div>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(request.status)}`}>
              {request.status.replace("_", " ")}
            </span>
          </div>

          {request.scheduledTime && (
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <strong>Scheduled:</strong> {new Date(request.scheduledTime).toLocaleString()}
            </div>
          )}

          {request.customerPhone && (
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <strong>Phone:</strong> {request.customerPhone}
            </div>
          )}

          {request.notes && (
            <div className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              <strong>Notes:</strong> {request.notes}
            </div>
          )}

          {/* Call Details (for completed phone calls) - Only show for service_tech and super_admin */}
          {request.requestType === "phone_call" &&
           request.status === "completed" &&
           currentUser &&
           (currentUser.role === "service_tech" || currentUser.role === "super_admin") && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-600 rounded-lg border border-slate-200 dark:border-slate-500">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Call Details</h4>

              {!request.session ? (
                <div className="text-sm text-slate-500 dark:text-slate-400 italic">
                  Session data is being processed...
                </div>
              ) : (
              <div className="space-y-2 text-sm">
                {request.session.durationMinutes !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Duration:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{request.session.durationMinutes} minutes</span>
                  </div>
                )}

                {request.session.cost !== null && currentUser?.role === "super_admin" && (
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Cost:</span>
                    <span className="font-medium text-slate-900 dark:text-white">${Number(request.session.cost).toFixed(2)}</span>
                  </div>
                )}

                {/* Call Recording Player - Show when recording is available */}
                {request.session?.callRecordingUrl && request.session?.callRecordingSid && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-500">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">Call Recording:</span>
                      <a
                        href={`/api/twilio/recording/${request.session.callRecordingSid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline text-xs"
                      >
                        Download
                      </a>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 border border-slate-200 dark:border-slate-500">
                      <audio
                        controls
                        className="w-full"
                        style={{ maxHeight: '40px' }}
                      >
                        <source src={`/api/twilio/recording/${request.session.callRecordingSid}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}

                {/* Show message if recording is processing */}
                {!request.session?.callRecordingUrl && request.session?.callRecordingSid && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-500">
                    <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                      Recording is being processed. It will appear here automatically when ready (usually 1-2 minutes after call ends).
                    </div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-500">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Resolution Status:
                  </label>
                  <select
                    value={request.session.callResolutionStatus || ""}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      try {
                        const response = await fetch(`/api/sessions/${request.session!.id}`, {
                          method: "PATCH",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            callResolutionStatus: newStatus || null,
                          }),
                        });

                        if (response.ok) {
                          fetchRequests();
                          if (onRequestUpdated) {
                            onRequestUpdated();
                          }
                        } else {
                          const errorData = await response.json();
                          alert(errorData.error || "Failed to update resolution status");
                        }
                      } catch (error) {
                        console.error("Error updating resolution status:", error);
                        alert("Something went wrong. Please try again.");
                      }
                    }}
                    className="input text-sm"
                  >
                    <option value="">Select status...</option>
                    <option value="resolved">Resolved</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="needs_followup">Needs Follow-up</option>
                  </select>
                </div>

                {request.session.notes && (
                  <div className="mt-2">
                    <div className="text-slate-600 dark:text-slate-300 mb-1">Session Notes:</div>
                    <div className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-300">
                      {request.session.notes}
                    </div>
                  </div>
                )}
              </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            {request.status === "pending" && (
              <>
                <button
                  onClick={() => handleAction(request.id, "accept")}
                  className="btn-success text-sm px-3 py-1.5"
                >
                  Accept
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setShowScheduleModal(true);
                  }}
                  className="btn-primary text-sm px-3 py-1.5"
                >
                  Schedule
                </button>
                <button
                  onClick={() => handleAction(request.id, "decline")}
                  className="btn-danger text-sm px-3 py-1.5"
                >
                  Decline
                </button>
              </>
            )}
            
            {request.status === "scheduled" && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log("🔘 Start Call button clicked for request:", request);
                    handleStartCall(request);
                  }}
                  className="btn-success text-sm px-3 py-1.5"
                >
                  Start {request.requestType === "video_call" ? "Video Call" : request.requestType === "phone_call" ? "Phone Call" : "Chat"}
                </button>
                <button
                  onClick={() => handleAction(request.id, "cancel")}
                  className="btn-secondary text-sm px-3 py-1.5"
                >
                  Cancel
                </button>
              </>
            )}

            {request.status === "in_progress" && (
              <button
                onClick={() => handleAction(request.id, "complete")}
                className="btn-primary text-sm px-3 py-1.5"
              >
                End Call
              </button>
            )}

            {request.status === "accepted" && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log("🔘 Start Now button clicked for request:", request);
                  handleStartCall(request);
                }}
                className="btn-success text-sm px-3 py-1.5"
              >
                Start Now
              </button>
            )}
          </div>
        </div>
      ))}

          {/* Show More / Show Less Button */}
          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
            >
              {showAll ? (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Show Less
                </span>
              ) : (
                <span className="flex items-center justify-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  Show {requests.length - INITIAL_VISIBLE_COUNT} More
                </span>
              )}
            </button>
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Schedule {selectedRequest.requestType.replace("_", " ")}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Scheduled Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={techNotes}
                  onChange={(e) => setTechNotes(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Add any notes about this scheduled call..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowScheduleModal(false);
                  setSelectedRequest(null);
                  setScheduledTime("");
                  setTechNotes("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (scheduledTime) {
                    handleAction(selectedRequest.id, "schedule", scheduledTime);
                  } else {
                    alert("Please select a scheduled time");
                  }
                }}
                className="btn-primary flex-1"
              >
                Confirm Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Twilio Calling Modal */}
      {(showCallingModal || modalStateRef.current.phoneNumber) && (callingPhoneNumber || modalStateRef.current.phoneNumber) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4"
          style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={(e) => {
            // Close modal if clicking outside
            if (e.target === e.currentTarget) {
              console.log("Closing modal - clicked outside");
              setShowCallingModal(false);
              setCallingPhoneNumber(null);
              setCallingContactName(undefined);
              setCallingTicketNumber(undefined);
            }
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md h-[90vh] sm:h-[80vh] flex flex-col m-2 sm:m-0 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ zIndex: 10000 }}
          >
            <TwilioCalling
              phoneNumber={callingPhoneNumber || modalStateRef.current.phoneNumber || ""}
              contactName={callingContactName || modalStateRef.current.contactName}
              ticketNumber={callingTicketNumber || modalStateRef.current.ticketNumber}
              onCallStart={() => {
                console.log("Twilio call started");
              }}
              onCallEnd={handleCallEnd}
              onClose={() => {
                console.log("Closing Twilio calling modal");
                setShowCallingModal(false);
                setCallingPhoneNumber(null);
                setCallingContactName(undefined);
                setCallingTicketNumber(undefined);
                setCallingContactId(undefined);
                modalStateRef.current = { phoneNumber: null, contactName: undefined, ticketNumber: undefined, contactId: undefined };
                // Refresh requests after modal closes
                fetchRequests();
                if (onRequestUpdated) {
                  onRequestUpdated();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

