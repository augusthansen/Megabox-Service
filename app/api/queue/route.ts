import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Phone Queue API Route
 *
 * GET: Fetch queue entries (optionally filtered by ticketId or status)
 * POST: Join the phone queue
 */

// GET - Fetch queue entries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");
    const techId = searchParams.get("techId");

    const where: any = {};

    if (ticketId) {
      where.ticketId = ticketId;
    }
    if (status) {
      where.status = status;
    }
    if (customerId) {
      where.customerId = customerId;
    }
    if (techId) {
      where.techId = techId;
    }

    const queueEntries = await prisma.callQueue.findMany({
      where,
      orderBy: { position: "asc" },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // If fetching for a specific ticket (customer-side), return simplified format
    if (ticketId && queueEntries.length > 0 && !techId) {
      const entry = queueEntries[0];
      // Get tech name if connected
      let techName: string | undefined;
      if (entry.techId) {
        const tech = await prisma.user.findUnique({
          where: { id: entry.techId },
          select: { name: true },
        });
        techName = tech?.name;
      }
      return NextResponse.json({
        id: entry.id,
        position: entry.position,
        status: entry.status,
        estimatedWait: entry.estimatedWait,
        techName,
        videoCallActive: entry.videoCallActive,
        videoRoomUrl: entry.videoRoomUrl,
      });
    }

    return NextResponse.json(queueEntries);
  } catch (error) {
    console.error("Error fetching queue entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue entries" },
      { status: 500 }
    );
  }
}

// POST - Join the phone queue
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, customerId, customerPhone } = body;

    if (!ticketId || !customerId) {
      return NextResponse.json(
        { error: "ticketId and customerId are required" },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Check if already in queue for this ticket
    const existingEntry = await prisma.callQueue.findFirst({
      where: {
        ticketId,
        customerId,
        status: "waiting",
      },
    });

    if (existingEntry) {
      return NextResponse.json(existingEntry);
    }

    // Get current queue position
    const waitingCount = await prisma.callQueue.count({
      where: { status: "waiting" },
    });

    const position = waitingCount + 1;
    const estimatedWait = position * 5; // Rough estimate: 5 minutes per person

    // Create queue entry
    const queueEntry = await prisma.callQueue.create({
      data: {
        ticketId,
        customerId,
        customerPhone,
        position,
        estimatedWait,
        status: "waiting",
      },
    });

    return NextResponse.json(queueEntry, { status: 201 });
  } catch (error) {
    console.error("Error joining phone queue:", error);
    return NextResponse.json(
      { error: "Failed to join phone queue" },
      { status: 500 }
    );
  }
}
