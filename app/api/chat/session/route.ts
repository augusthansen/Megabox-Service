import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Chat Session API
 * 
 * POST: Create a new chat session for time tracking
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, userId, startTime } = body;

    if (!ticketId || !userId || !startTime) {
      return NextResponse.json(
        { error: "Ticket ID, User ID, and start time are required" },
        { status: 400 }
      );
    }

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, assignedToId: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Use assigned tech or the user who started the chat
    const techId = ticket.assignedToId || userId;

    // Create chat session
    const session = await prisma.session.create({
      data: {
        ticketId,
        techId,
        sessionType: "chat",
        startTime: new Date(startTime),
      },
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating chat session:", error);
    return NextResponse.json(
      {
        error: "Failed to create chat session",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

