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
    const body = await request.json();
    const { callResolutionStatus, notes } = body;
    
    const updateData: any = {};
    
    if (callResolutionStatus !== undefined) {
      // Validate resolution status
      const validStatuses = ["resolved", "ongoing", "needs_followup"];
      if (!validStatuses.includes(callResolutionStatus)) {
        return NextResponse.json(
          { error: `Invalid resolution status. Must be one of: ${validStatuses.join(", ")}` },
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
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update session" },
      { status: 500 }
    );
  }
}

