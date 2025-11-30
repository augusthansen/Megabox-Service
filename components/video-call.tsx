"use client";

import { useEffect, useRef, useState } from "react";

interface VideoCallProps {
  roomUrl: string;
  roomName?: string;
  meetingToken?: string | null;
  userName: string;
  userId: string;
  onLeave: () => void;
}

/**
 * Video Call Component
 * 
 * Embeds Daily.co video call using their iframe
 */
export default function VideoCall({
  roomUrl,
  roomName,
  meetingToken,
  userName,
  userId,
  onLeave,
}: VideoCallProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomUrl) {
      setError("Room URL is required");
      setIsLoading(false);
      return;
    }

    // Set a timeout to detect if iframe fails to load
    const loadTimeout = setTimeout(() => {
      setError("Video call failed to load. Please check your internet connection and try again.");
      setIsLoading(false);
    }, 15000); // 15 second timeout

    // If we have a meeting token, append it to the URL
    // Daily.co iframe will handle the connection
    setIsLoading(false);

    return () => clearTimeout(loadTimeout);
  }, [roomUrl, meetingToken]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 rounded-lg p-8">
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-slate-900 mb-2">Error</p>
        <p className="text-slate-600 mb-4">{error}</p>
        <button onClick={onLeave} className="btn-primary">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-800 px-4 py-3 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">Video Call</h3>
        </div>
        <button
          onClick={onLeave}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Leave Call
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Connecting to video call...</p>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            src={meetingToken ? `${roomUrl}?t=${meetingToken}` : roomUrl}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            className="w-full h-full border-0"
            style={{ minHeight: "600px" }}
            title="Daily.co Video Call"
            onError={() => {
              setError("Failed to load video call. Please try opening in a new window.");
              setIsLoading(false);
            }}
            onLoad={() => {
              setIsLoading(false);
            }}
          />
        )}
      </div>

      {/* Instructions */}
      <div className="bg-slate-800 px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          Make sure to allow camera and microphone permissions when prompted
        </p>
        {/* Mobile fallback link */}
        <div className="mt-2 text-center">
          <a
            href={meetingToken ? `${roomUrl}?t=${meetingToken}` : roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary-400 hover:text-primary-300 underline"
          >
            Open in new window (better for mobile)
          </a>
        </div>
      </div>
    </div>
  );
}

