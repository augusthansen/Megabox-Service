import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Machines API Route
 * 
 * GET: Fetch all machines (optionally filtered by siteId)
 * POST: Create a new machine
 */

// GET - Fetch machines
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const siteId = searchParams.get("siteId");
    const companyId = searchParams.get("companyId");

    // Build where clause
    let where: any = {};
    
    if (siteId) {
      where.siteId = siteId;
    } else if (companyId) {
      // If filtering by companyId, we need to filter through sites
      where.site = {
        companyId: companyId,
      };
    }

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
    const body = await request.json();
    const { name, serialNumber, model, siteId, status } = body;

    // Validate required fields
    if (!name || !siteId) {
      return NextResponse.json(
        { error: "Machine name and site ID are required" },
        { status: 400 }
      );
    }

    // Create the machine
    const machine = await prisma.machine.create({
      data: {
        name,
        serialNumber: serialNumber || null,
        model: model || null,
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


