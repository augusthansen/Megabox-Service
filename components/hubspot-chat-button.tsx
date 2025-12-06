"use client";

import { useEffect, useState } from "react";

/**
 * HubSpot Chat Button Component
 * 
 * Shows a button to start chat instead of always-visible widget
 * Tracks chat session time for billing purposes
 */

interface HubSpotChatButtonProps {
  hubId?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    companyId?: string;
  };
  ticketId?: string; // Optional: link chat to a specific ticket
  companyName?: string; // Optional: company name for identification
  ticketNumber?: string; // Optional: ticket number for context
  className?: string;
}

// Business hours removed - chat is now always available

export default function HubSpotChatButton({ 
  hubId, 
  user, 
  ticketId,
  companyName,
  ticketNumber,
  className = "" 
}: HubSpotChatButtonProps) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Only load script when button is clicked (lazy load)
  const loadHubSpotScript = () => {
    if (scriptLoaded || !hubId) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      // Check if script already exists
      const existingScript = document.getElementById("hs-script-loader");
      if (existingScript) {
        setScriptLoaded(true);
        resolve();
        return;
      }

      // Load HubSpot Conversations API script
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.id = "hs-script-loader";
      script.async = true;
      script.defer = true;
      script.src = `https://js.hs-scripts.com/${hubId}.js`;
      
      // Add script to page
      const firstScript = document.getElementsByTagName("script")[0];
      if (firstScript && firstScript.parentNode) {
        firstScript.parentNode.insertBefore(script, firstScript);
      } else {
        document.head.appendChild(script);
      }

      script.onload = () => {
        setScriptLoaded(true);
        resolve();
      };

      script.onerror = () => {
        console.error("Failed to load HubSpot chat script");
        resolve(); // Resolve anyway to prevent hanging
      };
    });
  };

  const handleStartChat = async () => {
    // Load HubSpot script if not already loaded
    await loadHubSpotScript();

    // Wait for HubSpot to be ready
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds max wait
    
    while (!window.HubSpotConversations && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }

    if (!window.HubSpotConversations) {
      alert("Chat is loading, please wait a moment and try again.");
      return;
    }

    try {
      // Track session start BEFORE opening chat
      const startTime = new Date();
      setSessionStartTime(startTime);
      setChatOpen(true);

      // Create session record if we have ticket and user
      let sessionId: string | null = null;
      if (ticketId && user?.id) {
        try {
          const response = await fetch("/api/chat/session", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ticketId,
              userId: user.id,
              startTime: startTime.toISOString(),
            }),
          });

          if (response.ok) {
            const data = await response.json();
            sessionId = data.sessionId;
            setChatSessionId(sessionId);
          }
        } catch (error) {
          console.error("Error creating chat session:", error);
          // Continue even if session tracking fails
        }
      }

      // Load and open the chat widget
      try {
        // Load the widget with enhanced user identification
        if (window.HubSpotConversations.widget.load) {
          // Build identification with company name and ticket number included in the display name
          // This ensures techs can see the customer name, company, and ticket in HubSpot
          let displayName = user?.name || user?.email || "Customer";
          if (companyName) {
            displayName = `${displayName} (${companyName})`;
          }
          if (ticketNumber) {
            displayName = `${displayName} - Ticket ${ticketNumber}`;
          }
          
          const identification: any = {
            email: user?.email,
            name: displayName, // Include company and ticket in the name so techs can see it
          };
          
          window.HubSpotConversations.widget.load(identification);
          
          // Also try to use identify method with additional context (if available)
          setTimeout(() => {
            try {
              if ((window as any).HubSpotConversations?.widget?.identify) {
                (window as any).HubSpotConversations.widget.identify({
                  email: user?.email,
                  name: displayName,
                });
              }
            } catch (err) {
              // Identify method is optional
              console.log("Could not use identify method:", err);
            }
          }, 1500);
        }

        // Wait a moment for widget to load, then open it
        setTimeout(() => {
          try {
            // Make widget visible
            document.body.classList.add('chat-widget-visible');
            
            // Open the chat widget
            if (window.HubSpotConversations?.widget?.open) {
              window.HubSpotConversations.widget.open();
            } else {
              // Fallback: try to click the chat bubble
              const chatBubble = document.querySelector('[data-hs-conversations-widget]') as HTMLElement;
              if (chatBubble) {
                chatBubble.click();
              }
            }
          } catch (openError) {
            console.error("Error opening chat widget:", openError);
          }
        }, 800);
      } catch (loadError) {
        console.error("Error loading chat widget:", loadError);
      }

      // Track chat close events
      const finalSessionId = sessionId;
      const finalStartTime = startTime;

      // Check periodically if chat is still open
      const checkChatInterval = setInterval(() => {
        try {
          // Check if chat widget is visible/open
          const chatWidget = document.querySelector('[data-hs-conversations-widget]') as HTMLElement;
          const chatWindow = document.querySelector('[data-hs-conversations-widget] iframe');
          
          // If widget exists but is hidden, chat might be closed
          if (chatWidget && chatWidget.style.display === 'none') {
            // Chat was closed
            if (chatOpen && finalSessionId && finalStartTime) {
              endChatSessionWithData(finalSessionId, finalStartTime);
              clearInterval(checkChatInterval);
            }
          }
        } catch (err) {
          // Continue checking
        }
      }, 3000); // Check every 3 seconds

      // Store interval for cleanup
      (window as any).__chatCheckInterval = checkChatInterval;

      // Also track on page unload
      const handleBeforeUnload = () => {
        if (finalSessionId && finalStartTime) {
          // Send end session request (fire and forget)
          fetch(`/api/chat/session/${finalSessionId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              endTime: new Date().toISOString(),
              durationMinutes: Math.round((new Date().getTime() - finalStartTime.getTime()) / 60000),
            }),
            keepalive: true, // Keep request alive even after page unload
          }).catch(() => {}); // Ignore errors on unload
        }
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
    } catch (error) {
      console.error("Error opening chat:", error);
      alert("Could not open chat. Please try again.");
    }
  };

  const endChatSessionWithData = async (sessionId: string, startTime: Date) => {
    const endTime = new Date();
    const durationMinutes = Math.round(
      (endTime.getTime() - startTime.getTime()) / 60000
    );

    try {
      await fetch(`/api/chat/session/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          endTime: endTime.toISOString(),
          durationMinutes,
        }),
      });

      setChatSessionId(null);
      setSessionStartTime(null);
      setChatOpen(false);
    } catch (error) {
      console.error("Error ending chat session:", error);
    }
  };


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).__chatCheckInterval) {
        clearInterval((window as any).__chatCheckInterval);
      }
    };
  }, []);

  if (!hubId) {
    return null;
  }

  // Use className if provided, otherwise use default styling
  const buttonClasses = className || "inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium";

  return (
    <button
      onClick={handleStartChat}
      className={buttonClasses}
      disabled={chatOpen}
      title="Start a chat with our support team"
    >
      <svg
        className="w-4 h-4 mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      {chatOpen ? "Chat Open" : "Chat Now"}
    </button>
  );
}

// Extend Window interface
declare global {
  interface Window {
    HubSpotConversations?: {
      widget: {
        load: (config?: { email?: string; name?: string }) => void;
        open: () => void;
        close: () => void;
        remove: () => void;
        status: () => { loaded: boolean };
      };
      onReady?: (callback: () => void) => void;
    };
    __chatCheckInterval?: NodeJS.Timeout;
  }
}

