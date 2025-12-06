"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import CommunicationRequest from "@/components/communication-request";

const ChatWindow = dynamic(() => import("@/components/chat/ChatWindow"), {
  ssr: false,
  loading: () => (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 h-[400px] flex items-center justify-center">
      <p className="text-slate-500 dark:text-slate-400">Loading chat...</p>
    </div>
  ),
});

/**
 * Customer Ticket Detail Page
 * View detailed ticket information and status
 */

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  machineDown: boolean;
  resolutionNotes: string | null;
  resolutionCategory: string | null;
  satisfactionRating: number | null;
  satisfactionFeedback: string | null;
  company: {
    id: string;
    name: string;
  };
  machine: {
    id: string;
    name: string;
    model: string;
    serialNumber: string | null;
  } | null;
  site: {
    id: string;
    name: string;
    address: string;
  };
  createdBy: {
    name: string;
  };
  assignedTo: {
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function CustomerTicketDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const ticketId = params.id as string;
  const isSuccess = searchParams.get("success") === "true";

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(isSuccess);
  const [user, setUser] = useState<any>(null);
  const [activeVideoCall, setActiveVideoCall] = useState<any>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  // Satisfaction rating state
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  useEffect(() => {
    // Get user from session
    const userData = sessionStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }

    if (ticketId) {
      fetchTicket();
    }
  }, [ticketId]);

  useEffect(() => {
    if (showSuccess) {
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccess(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  const fetchTicket = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
        
        // Check for active video call communication request
        if (data.id) {
          checkForActiveVideoCall(data.id);
        }
      } else {
        console.error("Ticket not found");
      }
    } catch (error) {
      console.error("Error fetching ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkForActiveVideoCall = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/communication-requests?ticketId=${ticketId}&status=in_progress&requestType=video_call`);
      if (response.ok) {
        const requests = await response.json();
        const videoCallRequest = requests.find((r: any) => r.requestType === "video_call" && r.status === "in_progress");
        if (videoCallRequest && videoCallRequest.sessionId) {
          // Get session details to get room URL
          const sessionResponse = await fetch(`/api/tickets/${ticketId}`);
          if (sessionResponse.ok) {
            const ticketData = await sessionResponse.json();
            const session = ticketData.sessions?.find((s: any) => s.id === videoCallRequest.sessionId);
            if (session && session.videoRecordingUrl) {
              setActiveVideoCall({
                roomUrl: session.videoRecordingUrl,
                requestId: videoCallRequest.id,
              });
            }
          }
        } else {
          setActiveVideoCall(null);
        }
      }
    } catch (error) {
      console.error("Error checking for active video call:", error);
    }
  };

  // Poll for active video calls every 10 seconds
  useEffect(() => {
    if (!ticketId) return;
    
    const interval = setInterval(() => {
      checkForActiveVideoCall(ticketId);
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [ticketId]);

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

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      open: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      assigned: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
      in_progress: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
      resolved: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      closed: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
    };
    return icons[status] || icons.open;
  };

  const handleSubmitRating = async () => {
    if (selectedRating === 0) {
      alert("Please select a rating before submitting.");
      return;
    }

    setSubmittingRating(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/satisfaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: selectedRating,
          feedback: feedbackText.trim() || null,
          userId: user?.id,
          userName: user?.name,
        }),
      });

      if (response.ok) {
        setRatingSubmitted(true);
        setShowRatingForm(false);
        // Refresh ticket to get updated rating
        fetchTicket();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    const labels: Record<number, string> = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return labels[rating] || "";
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
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400 mb-4">Ticket not found</p>
        <Link href="/customer/tickets" className="btn-primary">
          Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-6 rounded-lg shadow-md animate-fadeIn">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-300">Ticket Submitted Successfully!</h3>
              <p className="text-green-700 dark:text-green-400 mt-1">
                Your ticket <span className="font-mono font-bold">{ticket.ticketNumber}</span> has been created and our team has been notified.
                {ticket.machineDown && " Since this is marked as urgent (machine down), we'll prioritize it immediately."}
              </p>
              <p className="text-sm text-green-600 dark:text-green-500 mt-2">
                We'll update you via email as we make progress.
              </p>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="text-green-500 hover:text-green-700 dark:hover:text-green-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Breadcrumb */}
      <Link
        href="/customer/tickets"
        className="inline-flex items-center text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Tickets
      </Link>

      {/* Header */}
      <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {ticket.ticketNumber}
              </h1>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full border flex items-center gap-2 ${getStatusColor(ticket.status)}`}>
                {getStatusIcon(ticket.status)}
                {ticket.status.replace("_", " ").toUpperCase()}
              </span>
              {ticket.machineDown && (
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                  MACHINE DOWN
                </span>
              )}
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Created {new Date(ticket.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Active Video Call Notification */}
          {activeVideoCall && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500 rounded-lg animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-300">Video Call Active</p>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      A technician has started a video call. Click below to join.
                    </p>
                  </div>
                </div>
                <a
                  href={activeVideoCall.roomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
                >
                  Join Video Call
                </a>
              </div>
            </div>
          )}

          {/* Communication Request - Show if ticket is assigned */}
          {ticket.assignedTo && user && (
            <div className="mt-4">
              <CommunicationRequest
                ticketId={ticket.id}
                userId={user.id}
                userPhone={user.phone}
                userEmail={user.email}
                userName={user.name}
                companyName={ticket.company?.name}
                ticketNumber={ticket.ticketNumber}
                onRequestCreated={() => {
                  // Refresh ticket data if needed
                  fetchTicket();
                }}
              />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-4 mb-2">
          {ticket.subject}
        </h2>

        {ticket.description && (
          <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {ticket.description}
          </p>
        )}
      </div>

      {/* Resolution Summary - Show when ticket is resolved/closed */}
      {(ticket.status === "resolved" || ticket.status === "closed") && ticket.resolutionNotes && (
        <div className="card p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resolution Summary
          </h3>
          {ticket.resolutionCategory && (
            <div className="mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 capitalize">
                {ticket.resolutionCategory.replace("_", " ")}
              </span>
            </div>
          )}
          <p className="text-green-800 dark:text-green-300 whitespace-pre-wrap">
            {ticket.resolutionNotes}
          </p>
        </div>
      )}

      {/* Satisfaction Rating Section */}
      {(ticket.status === "resolved" || ticket.status === "closed") && (
        <div className="card p-6 border-2 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
          {/* Already Rated */}
          {ticket.satisfactionRating ? (
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Thank You for Your Feedback!</h3>
              </div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-8 h-8 ${star <= ticket.satisfactionRating! ? "text-yellow-400" : "text-slate-300 dark:text-slate-600"}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                You rated this service <span className="font-semibold">{getRatingLabel(ticket.satisfactionRating)}</span>
              </p>
              {ticket.satisfactionFeedback && (
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">"{ticket.satisfactionFeedback}"</p>
              )}
            </div>
          ) : ratingSubmitted ? (
            /* Just Submitted */
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h3>
              <p className="text-slate-600 dark:text-slate-400">Your feedback helps us improve our service.</p>
            </div>
          ) : showRatingForm ? (
            /* Rating Form */
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 text-center">
                How was your experience?
              </h3>

              {/* Star Rating */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-10 h-10 ${
                        star <= (hoverRating || selectedRating)
                          ? "text-yellow-400"
                          : "text-slate-300 dark:text-slate-600"
                      } transition-colors`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              {(hoverRating || selectedRating) > 0 && (
                <p className="text-center text-slate-600 dark:text-slate-400 font-medium mb-4">
                  {getRatingLabel(hoverRating || selectedRating)}
                </p>
              )}

              {/* Feedback Text */}
              <div className="mb-4">
                <label htmlFor="feedback" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Additional Feedback (Optional)
                </label>
                <textarea
                  id="feedback"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  className="input min-h-[80px] dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder-slate-400"
                  rows={3}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRatingForm(false)}
                  className="btn-secondary"
                  disabled={submittingRating}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitRating}
                  disabled={selectedRating === 0 || submittingRating}
                  className="btn-primary flex items-center"
                >
                  {submittingRating ? (
                    <>
                      <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    "Submit Rating"
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Initial Prompt */
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">How Did We Do?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Your ticket has been resolved. We'd love to hear about your experience!
              </p>
              <button
                type="button"
                onClick={() => setShowRatingForm(true)}
                className="btn-primary"
              >
                Rate Our Service
              </button>
            </div>
          )}
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Location & Machine */}
        <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location & Equipment
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">LOCATION</p>
              <p className="text-slate-900 dark:text-white font-medium">{ticket.site.name}</p>
              {ticket.site.address && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.site.address}</p>
              )}
            </div>
            {ticket.machine ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">MACHINE</p>
                <p className="text-slate-900 dark:text-white font-medium">{ticket.machine.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.machine.model}</p>
                {ticket.machine.serialNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-500">SN: {ticket.machine.serialNumber}</p>
                )}
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">MACHINE</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">General issue (not machine-specific)</p>
              </div>
            )}
          </div>
        </div>

        {/* Status & Team */}
        <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Status & Team
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">PRIORITY</p>
              <span className={`inline-block px-3 py-1 text-sm font-medium rounded ${
                ticket.priority === "urgent" ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                ticket.priority === "high" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" :
                ticket.priority === "medium" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" :
                "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
              }`}>
                {ticket.priority.toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">SUBMITTED BY</p>
              <p className="text-slate-900 dark:text-white">{ticket.createdBy.name}</p>
            </div>
            {ticket.assignedTo ? (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ASSIGNED TECHNICIAN</p>
                <p className="text-slate-900 dark:text-white font-medium">{ticket.assignedTo.name}</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.assignedTo.email}</p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">ASSIGNED TECHNICIAN</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Not assigned yet - we're routing this to the best available tech</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline/Status Updates (Placeholder for future) */}
      <div className="card p-6 dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Activity Timeline
        </h3>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900 dark:text-white">Ticket Created</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{ticket.createdBy.name} submitted this ticket</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{new Date(ticket.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {ticket.updatedAt !== ticket.createdAt && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900 dark:text-white">Status Updated</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ticket status changed to {ticket.status.replace("_", " ")}</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{new Date(ticket.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Chat Section - Show when ticket is assigned */}
      {ticket.assignedTo && user && (
        <div className="card overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          {/* Chat Header - Always visible */}
          <button
            onClick={() => setIsChatExpanded(!isChatExpanded)}
            className="w-full flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Live Chat with Technician</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Chat directly with {ticket.assignedTo.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full">
                {isChatExpanded ? 'Hide' : 'Open Chat'}
              </span>
              <svg
                className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isChatExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {/* Chat Window - Collapsible Content */}
          {isChatExpanded && (
            <div className="h-[500px]">
              <ChatWindow
                ticketId={ticket.id}
                currentUserId={user.id}
                currentUserName={user.name}
                ticketNumber={ticket.ticketNumber}
                embedded={true}
              />
            </div>
          )}
        </div>
      )}

      {/* Need Help Section */}
      <div className="card p-6 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
        <div className="flex items-start gap-4">
          <svg className="w-8 h-8 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Need to add more information?</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              If you have additional details, photos, or questions about this ticket, please contact our support team.
            </p>
            <a
              href="mailto:support@megaboxsupply.com"
              className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

