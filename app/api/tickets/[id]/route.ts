import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTicketInHubspot } from "@/lib/hubspot";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Single Ticket API Route
 * 
 * GET: Fetch a single ticket with all details
 * PATCH: Update a ticket
 */

// GET - Fetch single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("API: GET /api/tickets/[id] called");
    const { id } = await params;
    console.log("API: Ticket ID extracted:", id);
    
    if (!id) {
      console.log("API: No ID provided");
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    console.log("API: Querying database for ticket:", id);
    
    // First, try a simple query to see if the ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            pricingTier: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Fetch sessions separately to avoid potential issues
        sessions: {
          orderBy: {
            startTime: "desc",
          },
          take: 20,
          include: {
            tech: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          // Include all session fields including call recording details
        },
        // Fetch comments separately to avoid potential issues
        comments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      console.log("API: Ticket not found for ID:", id);
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Convert Decimal types to numbers for JSON serialization
    const ticketWithNumbers = {
      ...ticket,
      totalCost: ticket.totalCost ? Number(ticket.totalCost) : 0,
      escalationFees: ticket.escalationFees ? Number(ticket.escalationFees) : 0,
      travelExpenses: ticket.travelExpenses ? Number(ticket.travelExpenses) : 0,
      sessions: ticket.sessions?.map((session: any) => ({
        ...session,
        cost: session.cost ? Number(session.cost) : null,
        rateAmount: session.rateAmount ? Number(session.rateAmount) : null,
        rateMultiplier: session.rateMultiplier ? Number(session.rateMultiplier) : 1,
        // Include call recording fields
        callRecordingUrl: session.callRecordingUrl || null,
        callTranscription: session.callTranscription || null,
        callResolutionStatus: session.callResolutionStatus || null,
        notes: session.notes || null,
      })),
    };

    console.log("API: Ticket found:", ticket.ticketNumber);
    return NextResponse.json(ticketWithNumbers);
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch ticket",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      priority,
      assignedToId,
      subject,
      description,
      machineDown,
      escalationFees,
      travelExpenses,
    } = body;

    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (assignedToId !== undefined) {
      updateData.assignedToId = assignedToId || null;
      if (assignedToId && !updateData.assignedAt) {
        updateData.assignedAt = new Date();
      }
    }
    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (machineDown !== undefined) updateData.machineDown = machineDown;
    if (escalationFees !== undefined) {
      updateData.escalationFees = new Decimal(escalationFees || 0);
    }
    if (travelExpenses !== undefined) {
      updateData.travelExpenses = new Decimal(travelExpenses || 0);
    }

    // Update timestamps based on status
    if (status === "in_progress" && !updateData.startedAt) {
      updateData.startedAt = new Date();
    }
    if (status === "resolved" && !updateData.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    if (status === "closed" && !updateData.closedAt) {
      updateData.closedAt = new Date();
    }

    // Get existing ticket to check for HubSpot ID
    const existingTicket = await prisma.ticket.findUnique({
      where: { id: id },
      select: { hubspotId: true },
    });

    // Update ticket in HubSpot if it exists and API key is configured
    if (process.env.HUBSPOT_API_KEY && existingTicket?.hubspotId) {
      try {
        await updateTicketInHubspot(existingTicket.hubspotId, {
          status: status || undefined,
          priority: priority || undefined,
          subject: subject || undefined,
          description: description || undefined,
        });
      } catch (error) {
        console.error("Error updating ticket in HubSpot (continuing anyway):", error);
        // Continue updating ticket locally even if HubSpot fails
      }
    }

    const ticket = await prisma.ticket.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
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
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
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

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

