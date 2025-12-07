import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Machine Position API
 *
 * POST /api/floor-plans/[siteId]/positions - Add a machine to the floor plan
 * PUT /api/floor-plans/[siteId]/positions - Update machine positions (batch)
 * DELETE /api/floor-plans/[siteId]/positions?machineId=xxx - Remove a machine from floor plan
 */

// POST - Add a machine to the floor plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { machineId, x, y, width, height, rotation, label, shapeId } = body;

    if (!machineId) {
      return NextResponse.json(
        { error: "machineId is required" },
        { status: 400 }
      );
    }

    // Get the floor plan (or create if doesn't exist)
    let floorPlan = await prisma.floorPlan.findUnique({
      where: { siteId },
    });

    if (!floorPlan) {
      floorPlan = await prisma.floorPlan.create({
        data: { siteId },
      });
    }

    // Check if machine is already placed
    const existing = await prisma.machinePosition.findUnique({
      where: { machineId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Machine is already placed on a floor plan" },
        { status: 400 }
      );
    }

    // Create position
    const position = await prisma.machinePosition.create({
      data: {
        floorPlanId: floorPlan.id,
        machineId,
        x: x ?? 100,
        y: y ?? 100,
        width: width ?? 160,  // Larger default for L-shaped inserter icon
        height: height ?? 120,
        rotation: rotation ?? 0,
        label,
        shapeId: shapeId || null,
      },
      include: {
        machine: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            status: true,
            isCurrentlyDown: true,
          },
        },
        shape: true,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("Error adding machine position:", error);
    return NextResponse.json(
      { error: "Failed to add machine position" },
      { status: 500 }
    );
  }
}

// PUT - Update machine positions (batch update)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { positions } = body;

    if (!Array.isArray(positions)) {
      return NextResponse.json(
        { error: "positions array is required" },
        { status: 400 }
      );
    }

    // Get the floor plan
    const floorPlan = await prisma.floorPlan.findUnique({
      where: { siteId },
    });

    if (!floorPlan) {
      return NextResponse.json(
        { error: "Floor plan not found" },
        { status: 404 }
      );
    }

    // Update each position
    const updates = await Promise.all(
      positions.map(
        async (pos: {
          machineId: string;
          x?: number;
          y?: number;
          width?: number;
          height?: number;
          rotation?: number;
          label?: string;
          shapeId?: string | null;
        }) => {
          return prisma.machinePosition.update({
            where: { machineId: pos.machineId },
            data: {
              ...(pos.x !== undefined && { x: pos.x }),
              ...(pos.y !== undefined && { y: pos.y }),
              ...(pos.width !== undefined && { width: pos.width }),
              ...(pos.height !== undefined && { height: pos.height }),
              ...(pos.rotation !== undefined && { rotation: pos.rotation }),
              ...(pos.label !== undefined && { label: pos.label }),
              ...(pos.shapeId !== undefined && { shapeId: pos.shapeId }),
            },
            include: {
              machine: {
                select: {
                  id: true,
                  name: true,
                  model: true,
                  serialNumber: true,
                  status: true,
                  isCurrentlyDown: true,
                },
              },
              shape: true,
            },
          });
        }
      )
    );

    return NextResponse.json({ positions: updates });
  } catch (error) {
    console.error("Error updating positions:", error);
    return NextResponse.json(
      { error: "Failed to update positions" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a machine from the floor plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get("machineId");

    if (!machineId) {
      return NextResponse.json(
        { error: "machineId query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.machinePosition.delete({
      where: { machineId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing machine position:", error);
    return NextResponse.json(
      { error: "Failed to remove machine position" },
      { status: 500 }
    );
  }
}
