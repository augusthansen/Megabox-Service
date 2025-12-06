import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyNewChatMessage } from "@/lib/notifications";

/**
 * Chat Messages API Route
 *
 * GET: Fetch chat messages for a ticket
 * POST: Send a new chat message
 */

// GET - Fetch chat messages for a ticket
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required" },
        { status: 400 }
      );
    }

    const messages = await prisma.chatMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat messages" },
      { status: 500 }
    );
  }
}

// POST - Send a new chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticketId, senderId, content } = body;

    if (!ticketId || !senderId || !content) {
      return NextResponse.json(
        { error: "ticketId, senderId, and content are required" },
        { status: 400 }
      );
    }

    // Get ticket with related info for notification
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: true,
        createdBy: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get sender info
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true, role: true },
    });

    // Create the chat message
    const message = await prisma.chatMessage.create({
      data: {
        ticketId,
        senderId,
        content,
      },
    });

    // Send notification to the other party
    const senderName = sender?.name || "Someone";
    const isServiceTech = sender?.role === "service_tech" || sender?.role === "super_admin";

    if (isServiceTech) {
      // Tech sent message, notify the customer who created the ticket
      if (ticket.createdById && ticket.createdById !== senderId) {
        await notifyNewChatMessage(
          ticket.createdById,
          senderName,
          ticket.ticketNumber,
          ticketId,
          false // customer portal
        );
      }
    } else {
      // Customer sent message, notify assigned tech
      if (ticket.assignedToId && ticket.assignedToId !== senderId) {
        await notifyNewChatMessage(
          ticket.assignedToId,
          senderName,
          ticket.ticketNumber,
          ticketId,
          true // admin portal
        );
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error sending chat message:", error);
    return NextResponse.json(
      { error: "Failed to send chat message" },
      { status: 500 }
    );
  }
}
