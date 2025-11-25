import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateTicketInHubspot } from "@/lib/hubspot";

/**
 * Single Ticket API Route
 * 
 * GET: Fetch a single ticket with all details
 * PATCH: Update a ticket
 */

// GET - Fetch single ticket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: {
        id: params.id,
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
        sessions: {
          orderBy: {
            startTime: "desc",
          },
          take: 10,
        },
        comments: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            user: {
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
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

// PATCH - Update ticket
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      status,
      priority,
      assignedToId,
      subject,
      description,
      machineDown,
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
      where: { id: params.id },
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
        id: params.id,
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

