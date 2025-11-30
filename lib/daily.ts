/**
 * Daily.co Integration Utilities
 * 
 * Handles video call room creation and management
 */

interface DailyRoom {
  id: string;
  name: string;
  url: string;
  config: {
    max_participants?: number;
    enable_recording?: boolean;
    enable_screenshare?: boolean;
  };
}

/**
 * Create a Daily.co room for a ticket
 */
export async function createDailyRoom(ticketId: string, ticketNumber: string): Promise<DailyRoom> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  const response = await fetch("https://api.daily.co/v1/rooms", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `ticket-${ticketId}`,
      privacy: "public", // Public rooms are easier to join, tokens can still be used for authentication
      properties: {
        enable_recording: "cloud",
        enable_screenshare: true,
        enable_chat: true,
        max_participants: 10,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours expiry
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create Daily.co room: ${error.error || response.statusText}`);
  }

  const room = await response.json();
  return {
    id: room.id,
    name: room.name,
    url: room.url,
    config: room.config || {},
  };
}

/**
 * Get a Daily.co room by ID
 */
export async function getDailyRoom(roomId: string): Promise<DailyRoom | null> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  const response = await fetch(`https://api.daily.co/v1/rooms/${roomId}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const error = await response.json();
    throw new Error(`Failed to get Daily.co room: ${error.error || response.statusText}`);
  }

  const room = await response.json();
  return {
    id: room.id,
    name: room.name,
    url: room.url,
    config: room.config || {},
  };
}

/**
 * Generate a meeting token for a user
 */
export async function createMeetingToken(
  roomName: string,
  userId: string,
  userName: string,
  isOwner: boolean = false
): Promise<string> {
  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    throw new Error("DAILY_API_KEY is not set in environment variables");
  }

  const response = await fetch("https://api.daily.co/v1/meeting-tokens", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        user_id: userId,
        user_name: userName,
        is_owner: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 2, // 2 hours expiry
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create meeting token: ${error.error || response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

