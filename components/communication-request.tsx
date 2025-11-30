"use client";

import { useState, useEffect } from "react";

interface CommunicationRequestProps {
  ticketId: string;
  userId: string;
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  companyName?: string;
  ticketNumber?: string;
  onRequestCreated?: () => void;
}

// Chat is always available - no business hours restriction

export default function CommunicationRequest({
  ticketId,
  userId,
  userPhone,
  userEmail,
  userName,
  companyName,
  ticketNumber,
  onRequestCreated,
}: CommunicationRequestProps) {
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<"video_call" | "phone_call" | "chat">("video_call");
  const [scheduledTime, setScheduledTime] = useState("");
  const [phone, setPhone] = useState(userPhone || "");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [chatScriptLoaded, setChatScriptLoaded] = useState(false);

  // Load HubSpot chat script
  const loadHubSpotScript = () => {
    if (chatScriptLoaded) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const hubId = process.env.NEXT_PUBLIC_HUBSPOT_HUB_ID || "242276679";
      const existingScript = document.getElementById("hs-script-loader");
      if (existingScript) {
        setChatScriptLoaded(true);
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "hs-script-loader";
      script.async = true;
      script.defer = true;
      script.src = `https://js.hs-scripts.com/${hubId}.js`;
      
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      script.onload = () => {
        setChatScriptLoaded(true);
        resolve();
      };

      script.onerror = () => {
        console.error("Failed to load HubSpot chat script");
        resolve();
      };
    });
  };

  // Handle immediate chat - always available
  const handleChatNow = async () => {
    // Always start chat immediately
    await loadHubSpotScript();

    // Wait for HubSpot to be ready
    let attempts = 0;
    const maxAttempts = 20;
    
    while (!(window as any).HubSpotConversations && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!(window as any).HubSpotConversations) {
      alert("Chat is loading, please wait a moment and try again.");
      return;
    }

    try {
      // Create session record
      const startTime = new Date();
      try {
        await fetch("/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId,
            userId,
            startTime: startTime.toISOString(),
          }),
        });
      } catch (error) {
        console.error("Error creating chat session:", error);
      }

      // Load and open chat widget with enhanced identification
      if ((window as any).HubSpotConversations.widget.load) {
        // Build identification with company name included in the display name
        // This ensures techs can see the customer name and company in HubSpot
        let displayName = userName || userEmail || "Customer";
        if (companyName) {
          displayName = `${displayName} (${companyName})`;
        }
        if (ticketNumber) {
          displayName = `${displayName} - Ticket ${ticketNumber}`;
        }
        
        const identification: any = {
          email: userEmail,
          name: displayName, // Include company and ticket in the name so techs can see it
        };
        
        // Load widget with identification
        (window as any).HubSpotConversations.widget.load(identification);
        
        // Also try to use identify method with additional context (if available)
        setTimeout(() => {
          try {
            if ((window as any).HubSpotConversations?.widget?.identify) {
              (window as any).HubSpotConversations.widget.identify({
                email: userEmail,
                name: displayName,
              });
            }
          } catch (err) {
            // Identify method is optional
            console.log("Could not use identify method:", err);
          }
        }, 1500);
      }

      setTimeout(() => {
        try {
          document.body.classList.add('chat-widget-visible');
          if ((window as any).HubSpotConversations.widget.open) {
            (window as any).HubSpotConversations.widget.open();
          }
        } catch (error) {
          console.error("Error opening chat widget:", error);
        }
      }, 800);
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Could not open chat. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/communication-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          requestedById: userId,
          requestType,
          scheduledTime: scheduledTime || null,
          customerPhone: requestType === "phone_call" ? phone : null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(
          requestType === "video_call"
            ? scheduledTime
              ? `Video call request submitted! Scheduled for ${new Date(scheduledTime).toLocaleString()}. The technician will confirm the time.`
              : "Video call request submitted! The technician will contact you shortly."
            : requestType === "phone_call"
            ? scheduledTime
              ? `Phone call request submitted! Scheduled for ${new Date(scheduledTime).toLocaleString()}. The technician will call you at that time.`
              : "Phone call request submitted! The technician will call you shortly."
            : "Message submitted! We'll get back to you during business hours (9 AM - 5 PM, Mon-Fri)."
        );
        setShowForm(false);
        setScheduledTime("");
        setNotes("");
        if (onRequestCreated) {
          onRequestCreated();
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to submit request. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting communication request:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!showForm) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Chat Now Button - Always available */}
        <button
          onClick={handleChatNow}
          className="btn-primary flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Chat Now
        </button>
        {/* Request Communication Button - For video/phone calls */}
        <button
          onClick={() => setShowForm(true)}
          className="btn-secondary flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Request Call
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">Request Communication</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-slate-400 hover:text-slate-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Request Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Communication Type *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setRequestType("video_call")}
              className={`p-4 rounded-lg border-2 transition-all ${
                requestType === "video_call"
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="font-medium text-sm">Video Call</div>
            </button>
            <button
              type="button"
              onClick={() => setRequestType("phone_call")}
              className={`p-4 rounded-lg border-2 transition-all ${
                requestType === "phone_call"
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div className="font-medium text-sm">Phone Call</div>
            </button>
            <button
              type="button"
              onClick={() => setRequestType("chat")}
              className={`p-4 rounded-lg border-2 transition-all ${
                requestType === "chat"
                  ? "border-primary-500 bg-primary-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <div className="font-medium text-sm">Chat</div>
            </button>
          </div>
        </div>

        {/* Phone Number (for phone calls) */}
        {requestType === "phone_call" && (
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
              Phone Number *
            </label>
            <input
              id="phone"
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input"
              placeholder="(555) 123-4567"
            />
            <p className="mt-1 text-xs text-slate-500">
              The technician will call this number
            </p>
          </div>
        )}

        {/* Scheduled Time (optional) */}
        <div>
          <label htmlFor="scheduledTime" className="block text-sm font-semibold text-slate-700 mb-2">
            Preferred Time (Optional)
          </label>
          <input
            id="scheduledTime"
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="input"
            min={new Date().toISOString().slice(0, 16)}
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave blank for immediate communication, or select a preferred time
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input"
            rows={3}
            placeholder="Any specific information the technician should know..."
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

