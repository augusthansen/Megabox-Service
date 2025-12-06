"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * Service Tech Queue Management Page
 *
 * Allows service techs to see incoming queue entries and accept customers
 */

interface QueueEntry {
  id: string;
  ticketId: string;
  customerId: string;
  customerPhone: string | null;
  position: number;
  status: "waiting" | "connected" | "completed" | "abandoned";
  estimatedWait: number | null;
  techId: string | null;
  videoCallActive: boolean;
  videoRoomUrl: string | null;
  joinedAt: string;
  connectedAt: string | null;
  completedAt: string | null;
  ticket: {
    id: string;
    ticketNumber: string;
    subject: string;
    company?: {
      name: string;
    };
  };
  customer?: {
    name: string;
    email: string;
  };
}

interface QueueStats {
  waiting: number;
  connected: number;
  completedToday: number;
  avgWaitTime: number;
}

export default function QueuePage() {
  const router = useRouter();
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [myActiveEntry, setMyActiveEntry] = useState<QueueEntry | null>(null);
  const [stats, setStats] = useState<QueueStats>({
    waiting: 0,
    connected: 0,
    completedToday: 0,
    avgWaitTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchQueue();
      // Poll for updates every 5 seconds
      pollIntervalRef.current = setInterval(fetchQueue, 5000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [currentUser]);

  const fetchQueue = async () => {
    try {
      // Fetch all waiting queue entries
      const response = await fetch("/api/queue?status=waiting");
      if (response.ok) {
        const data = await response.json();
        setQueueEntries(Array.isArray(data) ? data : []);

        // Calculate stats
        const waiting = Array.isArray(data) ? data.length : 0;
        setStats((prev) => ({ ...prev, waiting }));
      }

      // Fetch my active connection if any
      if (currentUser?.id) {
        const myResponse = await fetch(`/api/queue?techId=${currentUser.id}&status=connected`);
        if (myResponse.ok) {
          const myData = await myResponse.json();
          if (Array.isArray(myData) && myData.length > 0) {
            setMyActiveEntry(myData[0]);
            setStats((prev) => ({ ...prev, connected: myData.length }));
          } else {
            setMyActiveEntry(null);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching queue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptCustomer = async (entryId: string) => {
    if (!currentUser?.id) return;

    setAccepting(entryId);
    try {
      const response = await fetch(`/api/queue/${entryId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "connected",
          techId: currentUser.id,
        }),
      });

      if (response.ok) {
        const entry = await response.json();
        setMyActiveEntry(entry);
        fetchQueue();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to accept customer");
      }
    } catch (error) {
      console.error("Error accepting customer:", error);
      alert("Failed to accept customer");
    } finally {
      setAccepting(null);
    }
  };

  const handleCompleteCall = async () => {
    if (!myActiveEntry) return;

    try {
      const response = await fetch(`/api/queue/${myActiveEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "completed",
        }),
      });

      if (response.ok) {
        setMyActiveEntry(null);
        fetchQueue();
      }
    } catch (error) {
      console.error("Error completing call:", error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!myActiveEntry) return;

    try {
      const response = await fetch("/api/video/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticketId: myActiveEntry.ticketId,
          initiatedBy: currentUser.id,
          queueId: myActiveEntry.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update queue entry with video info
        await fetch(`/api/queue/${myActiveEntry.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            videoCallActive: true,
            videoRoomUrl: data.roomUrl,
          }),
        });
        window.open(data.roomUrl, "_blank", "width=800,height=600");
        fetchQueue();
      }
    } catch (error) {
      console.error("Error starting video call:", error);
    }
  };

  const formatWaitTime = (joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const diffMs = now.getTime() - joined.getTime();
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Phone Queue</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Accept and manage incoming customer calls
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Waiting</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.waiting}</p>
            </div>
            <div className="p-3 bg-warning-50 dark:bg-warning-900/30 rounded-lg">
              <svg className="w-6 h-6 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Your Active Calls</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{myActiveEntry ? 1 : 0}</p>
            </div>
            <div className="p-3 bg-success-50 dark:bg-success-900/30 rounded-lg">
              <svg className="w-6 h-6 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {myActiveEntry ? (
                  <span className="text-success-600 dark:text-success-400">On Call</span>
                ) : stats.waiting > 0 ? (
                  <span className="text-warning-600 dark:text-warning-400">Customers Waiting</span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400">Available</span>
                )}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${myActiveEntry ? "bg-success-50 dark:bg-success-900/30" : stats.waiting > 0 ? "bg-warning-50 dark:bg-warning-900/30" : "bg-slate-100 dark:bg-slate-700"}`}>
              <div className={`w-3 h-3 rounded-full ${myActiveEntry ? "bg-success-500" : stats.waiting > 0 ? "bg-warning-500 animate-pulse" : "bg-slate-400"}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Call Panel */}
      {myActiveEntry && (
        <div className="card border-2 border-success-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Call</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Ticket #{myActiveEntry.ticket.ticketNumber} - {myActiveEntry.ticket.subject}
                </p>
              </div>
            </div>
            <span className="badge badge-success">Connected</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Customer Phone:</span>
                <span className="ml-2 font-medium dark:text-white">{myActiveEntry.customerPhone || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Connected:</span>
                <span className="ml-2 font-medium dark:text-white">
                  {myActiveEntry.connectedAt
                    ? formatWaitTime(myActiveEntry.connectedAt)
                    : "Just now"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/admin/tickets/${myActiveEntry.ticketId}`}
              className="btn-primary flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              View Ticket
            </Link>

            {!myActiveEntry.videoCallActive ? (
              <button
                onClick={handleStartVideoCall}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Start Video
              </button>
            ) : (
              <button
                onClick={() => window.open(myActiveEntry.videoRoomUrl!, "_blank")}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Rejoin Video
              </button>
            )}

            <button
              onClick={handleCompleteCall}
              className="btn-success flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete Call
            </button>
          </div>
        </div>
      )}

      {/* Waiting Queue */}
      <div className="card">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Waiting Customers</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {queueEntries.length} customer{queueEntries.length !== 1 ? "s" : ""} waiting
          </p>
        </div>

        {queueEntries.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-lg mb-2">No customers waiting</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm">New queue entries will appear here automatically</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {queueEntries.map((entry, index) => (
              <div
                key={entry.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-4">
                      <span className="text-primary-700 dark:text-primary-400 font-bold">{entry.position}</span>
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        Ticket #{entry.ticket.ticketNumber}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {entry.ticket.subject}
                      </div>
                      {entry.ticket.company && (
                        <div className="text-xs text-slate-400 dark:text-slate-500">
                          {entry.ticket.company.name}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Wait time</div>
                      <div className="font-mono text-slate-700 dark:text-slate-300">
                        {formatWaitTime(entry.joinedAt)}
                      </div>
                    </div>

                    {entry.customerPhone && (
                      <div className="text-right">
                        <div className="text-sm text-slate-500 dark:text-slate-400">Phone</div>
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {entry.customerPhone}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleAcceptCustomer(entry.id)}
                      disabled={accepting === entry.id || !!myActiveEntry}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {accepting === entry.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Accepting...
                        </span>
                      ) : (
                        "Accept"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Footer */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>Queue updates automatically every 5 seconds</p>
      </div>
    </div>
  );
}
