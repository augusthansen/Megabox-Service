"use client";

import { useEffect, useState, useRef } from "react";

interface QueueInfo {
  id: string;
  position: number;
  status: "waiting" | "connected" | "completed" | "abandoned";
  estimatedWait: number | null;
  techName?: string;
  videoCallActive: boolean;
  videoRoomUrl?: string;
}

interface PhoneQueueStatusProps {
  ticketId?: string;
  ticketNumber: string;
  ticketSubject?: string;
  customerId?: string;
  queueEntryId?: string;
  onClose?: () => void;
}

export default function PhoneQueueStatus({
  ticketId,
  ticketNumber,
  ticketSubject,
  customerId,
  queueEntryId,
  onClose,
}: PhoneQueueStatusProps) {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitTime, setWaitTime] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchQueueStatus();
    // Poll for queue updates every 5 seconds
    pollIntervalRef.current = setInterval(fetchQueueStatus, 5000);
    // Update wait time display every second
    waitTimerRef.current = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (waitTimerRef.current) {
        clearInterval(waitTimerRef.current);
      }
    };
  }, [ticketId, queueEntryId]);

  const fetchQueueStatus = async () => {
    try {
      // Use queueEntryId if available, otherwise ticketId
      const url = queueEntryId
        ? `/api/queue/${queueEntryId}`
        : `/api/queue?ticketId=${ticketId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setQueueInfo(data);
      }
    } catch (error) {
      console.error("Error fetching queue status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveQueue = async () => {
    try {
      await fetch(`/api/queue/${queueInfo?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "abandoned" }),
      });
      onClose?.();
    } catch (error) {
      console.error("Error leaving queue:", error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!queueInfo) return;

    try {
      const response = await fetch("/api/video/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId,
          initiatedBy: customerId,
          queueId: queueInfo.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.roomUrl, "_blank", "width=800,height=600");
        fetchQueueStatus();
      }
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const formatWaitTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Joining queue...</p>
        </div>
      </div>
    );
  }

  if (!queueInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <p>Unable to join queue. Please try again.</p>
          <button
            onClick={() => onClose?.()}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Phone Queue - Ticket #{ticketNumber}</h3>
          <p className="text-sm text-gray-500">
            {queueInfo.status === "waiting"
              ? "Waiting for a technician..."
              : queueInfo.status === "connected"
              ? `Connected with ${queueInfo.techName || "technician"}`
              : "Call ended"}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status Display */}
      <div className="flex flex-col items-center py-8">
        {queueInfo.status === "waiting" ? (
          <>
            {/* Animated phone icon */}
            <div className="relative mb-6">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                {queueInfo.position}
              </div>
            </div>

            <h4 className="text-2xl font-bold text-gray-900 mb-2">
              Position #{queueInfo.position} in Queue
            </h4>

            <p className="text-gray-600 mb-4">
              {queueInfo.estimatedWait
                ? `Estimated wait: ~${queueInfo.estimatedWait} minutes`
                : "Please hold, a technician will be with you shortly"}
            </p>

            <div className="text-sm text-gray-500 mb-8">
              Time in queue: {formatWaitTime(waitTime)}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleLeaveQueue}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Leave Queue
              </button>
            </div>
          </>
        ) : queueInfo.status === "connected" ? (
          <>
            {/* Connected state */}
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h4 className="text-2xl font-bold text-green-600 mb-2">Connected!</h4>

            <p className="text-gray-600 mb-6">
              You&apos;re now connected with {queueInfo.techName || "a technician"}
            </p>

            {/* Video call option during phone call */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6 w-full max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-purple-900">Need to share your screen?</p>
                  <p className="text-sm text-purple-700">Start a video call for visual assistance</p>
                </div>
                {queueInfo.videoCallActive ? (
                  <button
                    onClick={() => window.open(queueInfo.videoRoomUrl, "_blank")}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Rejoin Video
                  </button>
                ) : (
                  <button
                    onClick={handleStartVideoCall}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Start Video
                  </button>
                )}
              </div>
            </div>

            <button
              onClick={() => onClose?.()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close Window
            </button>
          </>
        ) : (
          <>
            {/* Completed/Abandoned state */}
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h4 className="text-2xl font-bold text-gray-600 mb-2">Call Ended</h4>

            <button
              onClick={() => onClose?.()}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </>
        )}
      </div>

      {/* Info footer */}
      {queueInfo.status === "waiting" && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-500 text-center">
            Your request details have been sent to our support team. A technician will call you when it&apos;s your turn.
          </p>
        </div>
      )}
    </div>
  );
}
