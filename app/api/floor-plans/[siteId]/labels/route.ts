import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Floor Plan Labels API
 *
 * POST /api/floor-plans/[siteId]/labels - Create a new text label
 * PUT /api/floor-plans/[siteId]/labels - Update labels (batch)
 * DELETE /api/floor-plans/[siteId]/labels?labelId=xxx - Delete a label
 */

// POST - Create a new label
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const { text, x, y, fontSize, fontWeight, color, rotation } = body;

    if (!text) {
      return NextResponse.json(
        { error: "text is required" },
        { status: 400 }
      );
    }

    // Get the floor plan
    let floorPlan = await prisma.floorPlan.findUnique({
      where: { siteId },
    });

    if (!floorPlan) {
      floorPlan = await prisma.floorPlan.create({
        data: { siteId },
      });
    }

    // Create the label
    const label = await prisma.floorPlanLabel.create({
      data: {
        floorPlanId: floorPlan.id,
        text,
        x: x ?? 100,
        y: y ?? 100,
        fontSize: fontSize ?? 16,
        fontWeight: fontWeight ?? "normal",
        color: color ?? "#374151",
        rotation: rotation ?? 0,
      },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error("Error creating label:", error);
    return NextResponse.json(
      { error: "Failed to create label" },
      { status: 500 }
    );
  }
}

// PUT - Update labels (batch or single)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const body = await request.json();
    const { labels } = body;

    if (!Array.isArray(labels)) {
      return NextResponse.json(
        { error: "labels array is required" },
        { status: 400 }
      );
    }

    // Update each label
    const updates = await Promise.all(
      labels.map(
        async (label: {
          id: string;
          text?: string;
          x?: number;
          y?: number;
          fontSize?: number;
          fontWeight?: string;
          color?: string;
          rotation?: number;
        }) => {
          return prisma.floorPlanLabel.update({
            where: { id: label.id },
            data: {
              ...(label.text !== undefined && { text: label.text }),
              ...(label.x !== undefined && { x: label.x }),
              ...(label.y !== undefined && { y: label.y }),
              ...(label.fontSize !== undefined && { fontSize: label.fontSize }),
              ...(label.fontWeight !== undefined && { fontWeight: label.fontWeight }),
              ...(label.color !== undefined && { color: label.color }),
              ...(label.rotation !== undefined && { rotation: label.rotation }),
            },
          });
        }
      )
    );

    return NextResponse.json({ labels: updates });
  } catch (error) {
    console.error("Error updating labels:", error);
    return NextResponse.json(
      { error: "Failed to update labels" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a label
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const labelId = searchParams.get("labelId");

    if (!labelId) {
      return NextResponse.json(
        { error: "labelId query parameter is required" },
        { status: 400 }
      );
    }

    await prisma.floorPlanLabel.delete({
      where: { id: labelId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting label:", error);
    return NextResponse.json(
      { error: "Failed to delete label" },
      { status: 500 }
    );
  }
}
