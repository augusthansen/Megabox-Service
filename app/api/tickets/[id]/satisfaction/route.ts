import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logSatisfactionRated } from "@/lib/activity-log";

/**
 * POST /api/tickets/[id]/satisfaction
 * Submit customer satisfaction rating
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const body = await request.json();
    const { rating, feedback, userId, userName } = body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get the ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        satisfactionRating: true,
        createdById: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Only allow rating on resolved or closed tickets
    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      return NextResponse.json(
        { error: "Can only rate resolved or closed tickets" },
        { status: 400 }
      );
    }

    // Check if already rated
    if (ticket.satisfactionRating !== null) {
      return NextResponse.json(
        { error: "This ticket has already been rated" },
        { status: 400 }
      );
    }

    // Update the ticket with the rating
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        satisfactionRating: rating,
        satisfactionFeedback: feedback || null,
        satisfactionRatedAt: new Date(),
      },
    });

    // Log the activity
    await logSatisfactionRated(
      ticketId,
      userId || ticket.createdById,
      userName || "Customer",
      rating
    );

    return NextResponse.json({
      success: true,
      message: "Thank you for your feedback!",
      rating: updatedTicket.satisfactionRating,
    });
  } catch (error) {
    console.error("Error submitting satisfaction rating:", error);
    return NextResponse.json(
      { error: "Failed to submit rating" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets/[id]/satisfaction
 * Get satisfaction rating for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        satisfactionRating: true,
        satisfactionFeedback: true,
        satisfactionRatedAt: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      rating: ticket.satisfactionRating,
      feedback: ticket.satisfactionFeedback,
      ratedAt: ticket.satisfactionRatedAt,
    });
  } catch (error) {
    console.error("Error fetching satisfaction rating:", error);
    return NextResponse.json(
      { error: "Failed to fetch rating" },
      { status: 500 }
    );
  }
}
