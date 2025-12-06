import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Machine API Route
 *
 * GET: Fetch a single machine with its details and recent tickets
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const machine = await prisma.machine.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
            zipCode: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            status: true,
            priority: true,
            createdAt: true,
            resolvedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Only fetch recent tickets
        },
        alarms: {
          select: {
            id: true,
            alarmCode: true,
            alarmDescription: true,
            occurrenceDate: true,
            resolvedDate: true,
            resolution: true,
          },
          orderBy: {
            occurrenceDate: "desc",
          },
          take: 20, // Fetch recent alarms for history
        },
      },
    });

    if (!machine) {
      return NextResponse.json(
        { error: "Machine not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Error fetching machine:", error);
    return NextResponse.json(
      { error: "Failed to fetch machine" },
      { status: 500 }
    );
  }
}

// PUT - Update a machine
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const machine = await prisma.machine.update({
      where: { id },
      data: {
        name: body.name,
        model: body.model,
        series: body.series,
        serialNumber: body.serialNumber,
        status: body.status,
        isCurrentlyDown: body.isCurrentlyDown,
        hasRemoteAccess: body.hasRemoteAccess,
        remoteAccessType: body.remoteAccessType,
        remoteAccessId: body.remoteAccessId,
        windowsVersion: body.windowsVersion,
        directConnectVersion: body.directConnectVersion,
        firmwareVersion: body.firmwareVersion,
        configuration: body.configuration,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(machine);
  } catch (error) {
    console.error("Error updating machine:", error);
    return NextResponse.json(
      { error: "Failed to update machine" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a machine
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.machine.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting machine:", error);
    return NextResponse.json(
      { error: "Failed to delete machine" },
      { status: 500 }
    );
  }
}
