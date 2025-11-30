import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Communication Requests API Route
 * 
 * GET: Fetch communication requests (optionally filtered by ticketId, status, assignedToId)
 * POST: Create a new communication request
 */

// GET - Fetch communication requests
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");
    const status = searchParams.get("status");
    const assignedToId = searchParams.get("assignedToId");
    const requestedById = searchParams.get("requestedById");
    const requestType = searchParams.get("requestType");

    const where: any = {};

    if (ticketId) {
      where.ticketId = ticketId;
    }
    if (status) {
      // Support multiple statuses (comma-separated)
      if (status.includes(",")) {
        where.status = { in: status.split(",") };
      } else {
        where.status = status;
      }
    }
    if (assignedToId) {
      where.assignedToId = assignedToId;
    }
    if (requestedById) {
      where.requestedById = requestedById;
    }
    if (requestType) {
      where.requestType = requestType;
    }

    const requests = await prisma.communicationRequest.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            assignedToId: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        session: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            durationMinutes: true,
            cost: true,
            callRecordingUrl: true,
            callRecordingSid: true,
            callTranscription: true,
            callTranscriptionSid: true,
            callResolutionStatus: true,
            notes: true,
          },
        },
      },
    });

    // Auto-create sessions for completed phone calls that don't have one
    for (const request of requests) {
      if (request.requestType === "phone_call" && 
          request.status === "completed" && 
          !request.session) {
        try {
          const startTime = request.acceptedAt || request.createdAt;
          const endTime = request.completedAt || new Date();
          const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
          
          const session = await prisma.session.create({
            data: {
              ticketId: request.ticketId,
              techId: request.assignedToId || request.ticket.assignedToId || "",
              sessionType: "phone_call",
              startTime: startTime,
              endTime: endTime,
              durationMinutes: durationMinutes,
              communicationRequestId: request.id,
            },
          });
          
          // Update the request with the session
          await prisma.communicationRequest.update({
            where: { id: request.id },
            data: { sessionId: session.id },
          });
          
          // Update the request object to include the session
          (request as any).session = {
            id: session.id,
            startTime: session.startTime,
            endTime: session.endTime,
            durationMinutes: session.durationMinutes,
            cost: null,
            callRecordingUrl: null,
            callTranscription: null,
            callResolutionStatus: null,
            notes: null,
          };
          
          console.log("Auto-created session for completed phone call:", request.id, session.id);
        } catch (error) {
          console.error("Error auto-creating session for communication request:", request.id, error);
        }
      }
    }

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error("Error fetching communication requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch communication requests", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create a new communication request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticketId,
      requestedById,
      requestType,
      scheduledTime,
      customerPhone,
      notes,
    } = body;

    // Validate required fields
    if (!ticketId || !requestedById || !requestType) {
      return NextResponse.json(
        { error: "Ticket ID, Requested By ID, and Request Type are required" },
        { status: 400 }
      );
    }

    // Validate request type
    const validTypes = ["video_call", "phone_call", "chat"];
    if (!validTypes.includes(requestType)) {
      return NextResponse.json(
        { error: "Invalid request type. Must be video_call, phone_call, or chat" },
        { status: 400 }
      );
    }

    // Verify ticket exists and get assigned tech
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        assignedToId: true,
        status: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // If ticket is not assigned, return error
    if (!ticket.assignedToId) {
      return NextResponse.json(
        { error: "Ticket must be assigned to a technician before requesting communication" },
        { status: 400 }
      );
    }

    // For phone calls, require phone number
    if (requestType === "phone_call" && !customerPhone) {
      return NextResponse.json(
        { error: "Phone number is required for phone call requests" },
        { status: 400 }
      );
    }

    // Create the communication request
    const communicationRequest = await prisma.communicationRequest.create({
      data: {
        ticketId,
        requestedById,
        assignedToId: ticket.assignedToId, // Auto-assign to ticket's assigned tech
        requestType,
        status: scheduledTime ? "pending" : "pending", // Will be scheduled when tech accepts
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        customerPhone: customerPhone || null,
        notes: notes || null,
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(communicationRequest, { status: 201 });
  } catch (error: any) {
    console.error("Error creating communication request:", error);
    return NextResponse.json(
      { error: "Failed to create communication request", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

