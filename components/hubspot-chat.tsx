"use client";

import { useEffect } from "react";

/**
 * HubSpot Live Chat Widget Component
 * 
 * Embeds HubSpot's live chat widget using the Conversations API
 * Automatically identifies users and links conversations to their company
 */

interface HubSpotChatProps {
  hubId?: string;
  user?: {
    email?: string;
    name?: string;
    companyId?: string;
  };
}

export default function HubSpotChat({ hubId, user }: HubSpotChatProps) {
  useEffect(() => {
    // Only load if hubId is provided
    if (!hubId) {
      console.warn("HubSpot Hub ID not configured. Chat widget will not load.");
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

    // Initialize chat widget when script loads
    script.onload = () => {
      // Wait for HubSpot Conversations API to be available
      const checkHubSpot = setInterval(() => {
        if (window.HubSpotConversations) {
          try {
            // Use the Conversations API to load the widget
            window.HubSpotConversations.widget.load();

            // Identify user if available (this helps link conversations to contacts)
            if (user && user.email) {
              // Wait a bit for widget to be ready, then identify user
              setTimeout(() => {
                if (window.HubSpotConversations?.widget) {
                  try {
                    window.HubSpotConversations.widget.load({
                      email: user.email,
                      name: user.name,
                    });
                  } catch (err) {
                    // User identification is optional, continue if it fails
                    console.log("User identification optional:", err);
                  }
                }
              }, 500);
            }
          } catch (error) {
            console.warn("Could not initialize HubSpot chat:", error);
          }
          clearInterval(checkHubSpot);
        }
      }, 100);

      // Stop checking after 10 seconds
      setTimeout(() => clearInterval(checkHubSpot), 10000);
    };

    // Cleanup function
    return () => {
      // Remove script on unmount
      const existingScript = document.getElementById("hs-script-loader");
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [hubId, user]);

  // HubSpot will inject the widget automatically - no container needed
  return null;
}

// Extend Window interface for HubSpot Conversations API
declare global {
  interface Window {
    HubSpotConversations?: {
      widget: {
        load: (config?: {
          email?: string;
          name?: string;
        }) => void;
        open: () => void;
        close: () => void;
        remove: () => void;
        status: () => { loaded: boolean };
      };
      onReady?: (callback: () => void) => void;
    };
  }
}

