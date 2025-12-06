import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Session API
 * 
 * PATCH: Update session details (e.g., resolution status, notes)
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("[Session PATCH] Session ID:", id);

    // Check if session exists first
    const existingSession = await prisma.session.findUnique({
      where: { id },
    });

    if (!existingSession) {
      console.error("[Session PATCH] Session not found:", id);
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log("[Session PATCH] Request body:", body);

    const { callResolutionStatus, notes } = body;
    
    const updateData: any = {};
    
    if (callResolutionStatus !== undefined) {
      // Validate resolution status - allow null to clear the status
      const validStatuses = ["resolved", "ongoing", "needs_followup", null];
      if (!validStatuses.includes(callResolutionStatus)) {
        return NextResponse.json(
          { error: `Invalid resolution status. Must be one of: resolved, ongoing, needs_followup, or null` },
          { status: 400 }
        );
      }
      updateData.callResolutionStatus = callResolutionStatus;
    }
    
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    
    const session = await prisma.session.update({
      where: { id },
      data: updateData,
      include: {
        tech: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
      },
    });
    
    return NextResponse.json(session);
  } catch (error: any) {
    console.error("[Session PATCH] Error updating session:", error);
    console.error("[Session PATCH] Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      {
        error: error.message || "Failed to update session",
        details: error?.meta?.cause || error?.code,
      },
      { status: 500 }
    );
  }
}

