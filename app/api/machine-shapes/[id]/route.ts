import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Machine Shape API - Individual shape operations
 *
 * GET /api/machine-shapes/[id] - Get a single shape
 * PUT /api/machine-shapes/[id] - Update a shape
 * DELETE /api/machine-shapes/[id] - Delete a shape
 */

// GET - Fetch a single shape
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const shape = await prisma.machineShape.findUnique({
      where: { id: params.id },
    });

    if (!shape) {
      return NextResponse.json(
        { error: "Shape not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(shape);
  } catch (error) {
    console.error("Error fetching machine shape:", error);
    return NextResponse.json(
      { error: "Failed to fetch machine shape" },
      { status: 500 }
    );
  }
}

// PUT - Update a shape
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, points, inputArrow, outputArrow } = body;

    const existingShape = await prisma.machineShape.findUnique({
      where: { id: params.id },
    });

    if (!existingShape) {
      return NextResponse.json(
        { error: "Shape not found" },
        { status: 404 }
      );
    }

    // Don't allow editing default shapes
    if (existingShape.isDefault) {
      return NextResponse.json(
        { error: "Cannot edit default shapes" },
        { status: 403 }
      );
    }

    const shape = await prisma.machineShape.update({
      where: { id: params.id },
      data: {
        name: name ?? existingShape.name,
        points: points ?? existingShape.points,
        inputArrow: inputArrow !== undefined ? inputArrow : existingShape.inputArrow,
        outputArrow: outputArrow !== undefined ? outputArrow : existingShape.outputArrow,
        color: body.color ?? existingShape.color,
      },
    });

    return NextResponse.json(shape);
  } catch (error) {
    console.error("Error updating machine shape:", error);
    return NextResponse.json(
      { error: "Failed to update machine shape" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a shape
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingShape = await prisma.machineShape.findUnique({
      where: { id: params.id },
    });

    if (!existingShape) {
      return NextResponse.json(
        { error: "Shape not found" },
        { status: 404 }
      );
    }

    // Don't allow deleting default shapes
    if (existingShape.isDefault) {
      return NextResponse.json(
        { error: "Cannot delete default shapes" },
        { status: 403 }
      );
    }

    await prisma.machineShape.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting machine shape:", error);
    return NextResponse.json(
      { error: "Failed to delete machine shape" },
      { status: 500 }
    );
  }
}
