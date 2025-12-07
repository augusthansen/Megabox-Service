import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Floor Plan API
 *
 * GET /api/floor-plans/[siteId] - Get floor plan for a site (creates one if doesn't exist)
 * PUT /api/floor-plans/[siteId] - Update floor plan settings
 * DELETE /api/floor-plans/[siteId] - Delete floor plan and all positions
 */

// GET - Get or create floor plan for a site
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    // Check if site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        company: { select: { name: true } },
        machines: {
          select: {
            id: true,
            name: true,
            model: true,
            serialNumber: true,
            status: true,
            isCurrentlyDown: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Get or create floor plan
    let floorPlan = await prisma.floorPlan.findUnique({
      where: { siteId },
      include: {
        machinePositions: {
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
        },
        textLabels: true,
      },
    });

    // Create floor plan if it doesn't exist
    if (!floorPlan) {
      floorPlan = await prisma.floorPlan.create({
        data: {
          siteId,
          name: `${site.name} Floor Plan`,
        },
        include: {
          machinePositions: {
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
          },
          textLabels: true,
        },
      });
    }

    // Get machines not yet placed on the floor plan
    const placedMachineIds = floorPlan.machinePositions.map((p) => p.machineId);
    const unplacedMachines = site.machines.filter(
      (m) => !placedMachineIds.includes(m.id)
    );

    return NextResponse.json({
      floorPlan,
      site: {
        id: site.id,
        name: site.name,
        company: site.company,
      },
      unplacedMachines,
    });
  } catch (error) {
    console.error("Error fetching floor plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch floor plan" },
      { status: 500 }
    );
  }
}

// PUT - Update floor plan settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { name, width, height, gridSize, backgroundColor, showGrid } = body;

    const floorPlan = await prisma.floorPlan.update({
      where: { siteId },
      data: {
        ...(name !== undefined && { name }),
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(gridSize !== undefined && { gridSize }),
        ...(backgroundColor !== undefined && { backgroundColor }),
        ...(showGrid !== undefined && { showGrid }),
      },
      include: {
        machinePositions: {
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
        },
        textLabels: true,
      },
    });

    return NextResponse.json(floorPlan);
  } catch (error) {
    console.error("Error updating floor plan:", error);
    return NextResponse.json(
      { error: "Failed to update floor plan" },
      { status: 500 }
    );
  }
}

// DELETE - Delete floor plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    await prisma.floorPlan.delete({
      where: { siteId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting floor plan:", error);
    return NextResponse.json(
      { error: "Failed to delete floor plan" },
      { status: 500 }
    );
  }
}
