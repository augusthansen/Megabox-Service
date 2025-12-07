import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Machine Shapes API
 *
 * GET /api/machine-shapes - Get all shapes
 * POST /api/machine-shapes - Create a new shape
 */

// GET - Fetch all machine shapes
export async function GET() {
  try {
    const shapes = await prisma.machineShape.findMany({
      orderBy: [
        { isDefault: "desc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json(shapes);
  } catch (error) {
    console.error("Error fetching machine shapes:", error);
    return NextResponse.json(
      { error: "Failed to fetch machine shapes" },
      { status: 500 }
    );
  }
}

// POST - Create a new machine shape
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, points, inputArrow, outputArrow, color, createdById } = body;

    if (!name || !points || !Array.isArray(points) || points.length < 3) {
      return NextResponse.json(
        { error: "Name and at least 3 points are required" },
        { status: 400 }
      );
    }

    const shape = await prisma.machineShape.create({
      data: {
        name,
        points,
        inputArrow: inputArrow || null,
        outputArrow: outputArrow || null,
        color: color || "#06b6d4",
        createdById: createdById || null,
        isDefault: false,
      },
    });

    return NextResponse.json(shape, { status: 201 });
  } catch (error) {
    console.error("Error creating machine shape:", error);
    return NextResponse.json(
      { error: "Failed to create machine shape" },
      { status: 500 }
    );
  }
}
