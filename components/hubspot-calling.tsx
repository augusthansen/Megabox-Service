"use client";

import { useEffect, useRef, useState } from "react";

/**
 * HubSpot Calling Component
 * 
 * Embeds HubSpot's calling interface directly in the app using the Calling Extensions SDK
 */

interface HubSpotCallingProps {
  phoneNumber: string;
  contactId?: string;
  ticketId?: string;
  ticketNumber?: string;
  onCallStart?: () => void;
  onCallEnd?: (duration?: number) => void;
  onClose?: () => void;
}

export default function HubSpotCalling({
  phoneNumber,
  contactId,
  ticketId,
  ticketNumber,
  onCallStart,
  onCallEnd,
  onClose,
}: HubSpotCallingProps) {
  const [isReady, setIsReady] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callingRef = useRef<any>(null);

  useEffect(() => {
    // Load HubSpot Calling Extensions SDK
    const loadCallingSDK = async () => {
      try {
        // Dynamically import the SDK
        const CallingExtensions = (await import("@hubspot/calling-extensions-sdk")).default;
        
        // Initialize the calling extension with event handlers
        const calling = new CallingExtensions({
          debugMode: process.env.NODE_ENV === "development",
          eventHandlers: {
            onReady: () => {
              console.log("HubSpot Calling SDK ready");
              setIsReady(true);
              
              // Once ready, initiate the outbound call
              if (phoneNumber) {
                try {
                  calling.outboundCall({
                    phoneNumber,
                    createEngagement: true,
                  });
                } catch (err: any) {
                  console.error("Error initiating call:", err);
                  setError(err.message || "Failed to initiate call");
                }
              }
            },
            onDialNumber: (event: any) => {
              console.log("Dial number event:", event);
            },
            onCreateEngagementSucceeded: (event: any) => {
              console.log("Engagement created:", event);
              setIsCalling(true);
              if (onCallStart) {
                onCallStart();
              }
            },
            onCreateEngagementFailed: (event: any) => {
              console.error("Failed to create engagement:", event);
              setError(event.error || "Failed to create call engagement");
            },
            onUpdateEngagementSucceeded: (event: any) => {
              console.log("Engagement updated (call may have ended):", event);
              // When engagement is updated, the call may have ended
              // Check if we should close the modal
              if (isCalling && event.engagement?.ended) {
                setIsCalling(false);
                const duration = event.engagement?.duration ? Math.round(event.engagement.duration / 1000) : undefined;
                if (onCallEnd) {
                  onCallEnd(duration);
                }
              }
            },
            onUpdateEngagementFailed: (event: any) => {
              console.error("Failed to update engagement:", event);
            },
            onVisibilityChanged: (event: any) => {
              console.log("Visibility changed:", event);
              if (!event.isVisible && isCalling) {
                // Call ended or window closed
                setIsCalling(false);
                if (onCallEnd) {
                  onCallEnd();
                }
              }
            },
          },
        });

        callingRef.current = calling;
        
      } catch (err: any) {
        console.error("Error loading HubSpot Calling SDK:", err);
        setError(err.message || "Failed to load calling interface. Make sure HubSpot Calling Extensions is configured.");
      }
    };

    loadCallingSDK();

    // Cleanup on unmount
    return () => {
      if (callingRef.current) {
        try {
          callingRef.current.destroy?.();
        } catch (err) {
          console.error("Error destroying calling interface:", err);
        }
      }
    };
  }, [phoneNumber, onCallStart, onCallEnd]);

  // Note: Call initiation happens in the onReady handler above
  // The SDK will handle the call flow

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
        <button onClick={onClose} className="btn-primary">
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
          <div className={`w-3 h-3 rounded-full ${isCalling ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <h3 className="text-white font-semibold">
            {isCalling ? "Call in Progress" : "HubSpot Calling"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Calling Interface Container */}
      <div className="flex-1 relative">
        {!isReady ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading calling interface...</p>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-slate-900">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-white text-lg font-semibold mb-2">Ready to Call</p>
              <p className="text-slate-400 text-sm mb-4">{phoneNumber}</p>
              <p className="text-slate-500 text-xs">
                HubSpot will handle the call through your configured phone number
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800 px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          {isCalling 
            ? `Calling ${phoneNumber}...`
            : "HubSpot calling interface will appear here"}
        </p>
      </div>
    </div>
  );
}

