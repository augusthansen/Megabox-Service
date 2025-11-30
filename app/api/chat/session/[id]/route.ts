import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Chat Session Update API
 * 
 * PATCH: Update chat session with end time and duration
 */

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = await request.json();
    const { endTime, durationMinutes } = body;

    if (!endTime || durationMinutes === undefined) {
      return NextResponse.json(
        { error: "End time and duration are required" },
        { status: 400 }
      );
    }

    // Get session to calculate cost
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        ticket: {
          include: {
            company: {
              select: {
                hourlyRate: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Calculate cost based on hourly rate
    const hourlyRate = Number(session.ticket.company.hourlyRate);
    const cost = (hourlyRate / 60) * durationMinutes; // Cost per minute * duration

    // Update session
    const updatedSession = await prisma.session.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(endTime),
        durationMinutes,
        cost: cost,
      },
    });

    // Update ticket total minutes and cost
    const ticket = await prisma.ticket.findUnique({
      where: { id: session.ticketId },
      select: { totalMinutes: true, totalCost: true },
    });

    if (ticket) {
      const newTotalMinutes = (ticket.totalMinutes || 0) + durationMinutes;
      const newTotalCost = Number(ticket.totalCost || 0) + cost;

      await prisma.ticket.update({
        where: { id: session.ticketId },
        data: {
          totalMinutes: newTotalMinutes,
          totalCost: newTotalCost,
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: updatedSession.id,
        durationMinutes: updatedSession.durationMinutes,
        cost: Number(updatedSession.cost),
      },
    });
  } catch (error: any) {
    console.error("Error updating chat session:", error);
    return NextResponse.json(
      {
        error: "Failed to update chat session",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

