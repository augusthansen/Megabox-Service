import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Individual Queue Entry API Route
 *
 * GET: Fetch a specific queue entry
 * PATCH: Update queue entry status
 */

// GET - Fetch a specific queue entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const queueEntry = await prisma.callQueue.findUnique({
      where: { id },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
          },
        },
      },
    });

    if (!queueEntry) {
      return NextResponse.json(
        { error: "Queue entry not found" },
        { status: 404 }
      );
    }

    // Return in the format expected by PhoneQueueStatus component
    return NextResponse.json({
      id: queueEntry.id,
      position: queueEntry.position,
      status: queueEntry.status,
      estimatedWait: queueEntry.estimatedWait,
      techName: undefined, // Would be populated when connected
      videoCallActive: queueEntry.videoCallActive,
      videoRoomUrl: queueEntry.videoRoomUrl,
    });
  } catch (error) {
    console.error("Error fetching queue entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch queue entry" },
      { status: 500 }
    );
  }
}

// PATCH - Update queue entry status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, techId, videoCallActive, videoRoomUrl } = body;

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === "connected") {
        updateData.connectedAt = new Date();
      } else if (status === "completed" || status === "abandoned") {
        updateData.completedAt = new Date();
      }
    }

    if (techId !== undefined) {
      updateData.techId = techId;
    }

    if (videoCallActive !== undefined) {
      updateData.videoCallActive = videoCallActive;
    }

    if (videoRoomUrl !== undefined) {
      updateData.videoRoomUrl = videoRoomUrl;
    }

    const queueEntry = await prisma.callQueue.update({
      where: { id },
      data: updateData,
    });

    // If abandoned, update positions of remaining queue entries
    if (status === "abandoned") {
      await prisma.callQueue.updateMany({
        where: {
          status: "waiting",
          position: { gt: queueEntry.position },
        },
        data: {
          position: { decrement: 1 },
        },
      });
    }

    return NextResponse.json(queueEntry);
  } catch (error) {
    console.error("Error updating queue entry:", error);
    return NextResponse.json(
      { error: "Failed to update queue entry" },
      { status: 500 }
    );
  }
}
