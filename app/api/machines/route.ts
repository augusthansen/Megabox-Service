import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMachineSchema, validateRequest } from "@/lib/validations";

/**
 * Machines API Route
 *
 * GET: Fetch all machines (optionally filtered by siteId)
 * POST: Create a new machine
 */

// GET - Fetch machines
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");

    const where = siteId ? { siteId } : {};

    const machines = await prisma.machine.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(machines);
  } catch (error) {
    console.error("Error fetching machines:", error);
    return NextResponse.json(
      { error: "Failed to fetch machines" },
      { status: 500 }
    );
  }
}

// POST - Create a new machine
export async function POST(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateRequest(createMachineSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { serialNumber, model, siteId, status } = validation.data;

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Create the machine
    const machine = await prisma.machine.create({
      data: {
        serialNumber,
        model,
        siteId,
        status: status || "active",
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

    return NextResponse.json(machine, { status: 201 });
  } catch (error) {
    console.error("Error creating machine:", error);
    return NextResponse.json(
      { error: "Failed to create machine" },
      { status: 500 }
    );
  }
}
