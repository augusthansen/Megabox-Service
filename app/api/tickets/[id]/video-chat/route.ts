import { NextRequest, NextResponse } from "next/server";
import { createDailyRoom, getDailyRoom, createMeetingToken } from "@/lib/daily";
import { prisma } from "@/lib/prisma";

/**
 * Video Chat API Route
 * 
 * Creates or retrieves a Daily.co room for a ticket
 * POST: Create/start a video chat session
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { userId, userName } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "userId and userName are required" },
        { status: 400 }
      );
    }

    // Check if Daily.co API key is configured
    if (!process.env.DAILY_API_KEY) {
      return NextResponse.json(
        { error: "Daily.co API key is not configured. Please set DAILY_API_KEY in your environment variables." },
        { status: 500 }
      );
    }

    // Get ticket with customer info
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        companyId: true,
        siteId: true,
        createdById: true,
        assignedToId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            primaryContactId: true,
            primaryContact: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check if a session already exists for this ticket
    const existingSession = await prisma.session.findFirst({
      where: {
        ticketId: ticketId,
        sessionType: "video_call",
        endTime: null, // Active session
      },
      orderBy: {
        startTime: "desc",
      },
    });

    let roomUrl: string;
    let roomName: string;
    let sessionId: string;
    let meetingToken: string | null = null;

    if (existingSession && existingSession.videoRecordingUrl) {
      // Use existing room URL if available
      roomUrl = existingSession.videoRecordingUrl;
      // Extract room name from URL (format: https://domain.daily.co/room-name)
      const urlParts = roomUrl.split('/');
      roomName = urlParts[urlParts.length - 1];
      sessionId = existingSession.id;
    } else {
      // Create new Daily.co room
      const room = await createDailyRoom(ticketId, ticket.ticketNumber);
      roomUrl = room.url;
      roomName = room.name;

      // Create session record
      const session = await prisma.session.create({
        data: {
          ticketId: ticketId,
          techId: userId,
          sessionType: "video_call",
          startTime: new Date(),
          videoRecordingUrl: roomUrl,
        },
      });
      sessionId = session.id;

      // Notify customer by creating a CommunicationRequest
      // Use primary contact from site, or fall back to ticket creator
      const customerUserId = ticket.site?.primaryContactId || ticket.createdById;
      
      if (customerUserId && ticket.assignedToId) {
        try {
          // Check if there's already an active video call request
          const existingRequest = await prisma.communicationRequest.findFirst({
            where: {
              ticketId: ticketId,
              requestType: "video_call",
              status: {
                in: ["pending", "accepted", "scheduled", "in_progress"],
              },
            },
          });

          if (!existingRequest) {
            // Create a communication request to notify the customer
            await prisma.communicationRequest.create({
              data: {
                ticketId: ticketId,
                requestedById: customerUserId,
                assignedToId: ticket.assignedToId,
                requestType: "video_call",
                status: "in_progress",
                sessionId: session.id,
                acceptedAt: new Date(),
              },
            });
            console.log(`Created communication request to notify customer about video call for ticket ${ticket.ticketNumber}`);
          } else {
            // Update existing request to in_progress
            await prisma.communicationRequest.update({
              where: { id: existingRequest.id },
              data: {
                status: "in_progress",
                sessionId: session.id,
                acceptedAt: new Date(),
              },
            });
          }
        } catch (error) {
          console.error("Error creating communication request for customer notification:", error);
          // Continue even if notification fails
        }
      }
    }

    // Generate meeting token for the user to join the private room
    try {
      meetingToken = await createMeetingToken(roomName, userId, userName, true);
    } catch (error) {
      console.error("Error creating meeting token:", error);
      // Continue without token - room might be public or token generation failed
    }

    // Get customer info for response (for potential email/SMS notifications)
    const customerInfo = ticket.site?.primaryContact || ticket.createdBy;
    const customerIdForNotification = ticket.site?.primaryContactId || ticket.createdById;

    return NextResponse.json({
      success: true,
      roomUrl: roomUrl,
      roomName: roomName,
      meetingToken: meetingToken,
      sessionId: sessionId,
      ticketId: ticketId,
      customerNotified: !!customerIdForNotification,
      customerEmail: customerInfo?.email || null,
      customerPhone: customerInfo?.phone || null,
    });
  } catch (error: any) {
    console.error("Error creating video chat:", error);
    return NextResponse.json(
      { 
        error: "Failed to create video chat",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

