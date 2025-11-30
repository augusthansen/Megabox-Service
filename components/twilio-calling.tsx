"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Twilio Calling Component
 * 
 * Embeds Twilio's voice calling interface directly in the app
 */

interface TwilioCallingProps {
  phoneNumber: string;
  contactName?: string;
  ticketNumber?: string;
  onCallStart?: () => void;
  onCallEnd?: (duration?: number) => void;
  onClose?: () => void;
}

export default function TwilioCalling({
  phoneNumber,
  contactName,
  ticketNumber,
  onCallStart,
  onCallEnd,
  onClose,
}: TwilioCallingProps) {
  const [isReady, setIsReady] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const deviceRef = useRef<any>(null);
  const callRef = useRef<any>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent re-initialization if already initialized
    if (initializedRef.current) {
      console.log("[TwilioCalling] Already initialized, skipping...");
      return;
    }

    // Load Twilio Voice SDK
    const loadTwilioSDK = async () => {
      try {
        initializedRef.current = true;
        
        // Check if Twilio is configured
        if (!process.env.NEXT_PUBLIC_TWILIO_ENABLED) {
          // Try to get token anyway - might work if env vars are set server-side
        }
        
        // Dynamically import Twilio Voice SDK
        let Device: any;
        try {
          const twilioModule = await import("@twilio/voice-sdk");
          Device = twilioModule.Device;
        } catch (importError) {
          console.error("Failed to import Twilio Voice SDK:", importError);
          setError("Twilio Voice SDK not available. Please check your installation.");
          initializedRef.current = false;
          return;
        }
        
        // Sanitize identity for Twilio (alphanumeric, underscores, hyphens only)
        const sanitizeIdentity = (name: string): string => {
          const sanitized = name
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_{2,}/g, '_')
            .substring(0, 50);
          console.log(`[TwilioCalling] Sanitizing identity: "${name}" -> "${sanitized}"`);
          return sanitized;
        };
        
        const identity = sanitizeIdentity(contactName || "tech");
        
        // Get Twilio token from API
        console.log(`[TwilioCalling] Requesting token with identity: "${identity}"`);
        const response = await fetch(`/api/twilio/token?identity=${encodeURIComponent(identity)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to get Twilio token");
        }
        
        const { token, identity: returnedIdentity } = await response.json();
        
        console.log(`[TwilioCalling] Token received, identity in token: "${returnedIdentity}"`);
        
        if (!token) {
          throw new Error("No token received from server");
        }
        
        // Initialize Twilio Device
        const device = new Device(token, {
          logLevel: 1, // 0 = none, 1 = error, 2 = warn, 3 = info, 4 = debug
        });
        
        deviceRef.current = device;
        
        // Set up event listeners
        device.on("registered", () => {
          console.log("[TwilioCalling] Twilio device registered successfully");
          setIsReady(true);
        });
        
        device.on("error", (error: any) => {
          console.error("[TwilioCalling] Twilio device error:", error);
          setError(error.message || "Device error");
          initializedRef.current = false; // Allow retry on error
        });
        
        device.on("incoming", (call: any) => {
          console.log("[TwilioCalling] Incoming call:", call);
          // Handle incoming calls if needed
        });
        
        // Register the device
        console.log("[TwilioCalling] Registering device...");
        device.register();
        
      } catch (err: any) {
        console.error("[TwilioCalling] Error loading Twilio SDK:", err);
        setError(err.message || "Failed to load calling interface");
        initializedRef.current = false; // Allow retry on error
      }
    };

    loadTwilioSDK();

    // Cleanup on unmount
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (callRef.current) {
        callRef.current.disconnect();
      }
      if (deviceRef.current) {
        deviceRef.current.destroy();
        initializedRef.current = false;
      }
    };
  }, [contactName]);

  const handleMakeCall = async () => {
    if (!deviceRef.current || !isReady) {
      setError("Device not ready. Please wait...");
      return;
    }

    try {
      setIsCalling(true);
      setError(null);
      
      // Ensure phone number is in E.164 format (starts with +)
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith("+")) {
        // If it doesn't start with +, assume US number and add +1
        formattedNumber = formattedNumber.replace(/\D/g, ""); // Remove non-digits
        if (formattedNumber.length === 10) {
          formattedNumber = `+1${formattedNumber}`;
        } else if (formattedNumber.length === 11 && formattedNumber.startsWith("1")) {
          formattedNumber = `+${formattedNumber}`;
        } else {
          formattedNumber = `+${formattedNumber}`;
        }
      }
      
      console.log("[TwilioCalling] Making call to:", formattedNumber);
      
      // Make the call through Twilio
      // The 'To' parameter will be sent to the TwiML app
      const call = await deviceRef.current.connect({
        params: {
          To: formattedNumber,
        },
      });
      
      callRef.current = call;
      
      console.log("[TwilioCalling] Call initiated, waiting for connection...");
      
      // Start tracking call duration
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      if (onCallStart) {
        onCallStart();
      }
      
      // Handle call events
      call.on("accept", () => {
        console.log("[TwilioCalling] Call accepted");
      });
      
      call.on("disconnect", () => {
        console.log("[TwilioCalling] Call disconnected");
        setIsCalling(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        const duration = Math.floor((Date.now() - startTime) / 1000);
        if (onCallEnd) {
          onCallEnd(duration);
        }
      });
      
      call.on("error", (error: any) => {
        console.error("[TwilioCalling] Call error:", error);
        setError(error.message || "Call failed");
        setIsCalling(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      });
      
      call.on("cancel", () => {
        console.log("[TwilioCalling] Call cancelled");
        setIsCalling(false);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      });
      
    } catch (err: any) {
      console.error("[TwilioCalling] Error making call:", err);
      setError(err.message || "Failed to make call");
      setIsCalling(false);
    }
  };

  const handleEndCall = () => {
    if (callRef.current) {
      callRef.current.disconnect();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error && !isCalling) {
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
            {isCalling ? "Call in Progress" : "Twilio Calling"}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
        >
          Close
        </button>
      </div>

      {/* Calling Interface */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900">
        {!isReady ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Initializing calling interface...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <p className="text-white text-2xl font-semibold mb-2">
                {contactName || "Contact"}
              </p>
              <p className="text-slate-400 text-lg">{phoneNumber}</p>
              {ticketNumber && (
                <p className="text-slate-500 text-sm mt-2">Ticket: {ticketNumber}</p>
              )}
              {isCalling && (
                <p className="text-green-400 text-lg font-semibold mt-4">
                  {formatDuration(callDuration)}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              {!isCalling ? (
                <button
                  onClick={handleMakeCall}
                  className="px-8 py-4 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call Now
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="px-8 py-4 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End Call
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-slate-800 px-4 py-3 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          {isCalling 
            ? `Calling ${phoneNumber}...`
            : "Ready to make call"}
        </p>
      </div>
    </div>
  );
}

