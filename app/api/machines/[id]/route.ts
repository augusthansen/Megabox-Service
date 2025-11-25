import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Machine API Route
 * 
 * GET: Fetch a single machine with its site and tickets
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const machine = await prisma.machine.findUnique({
      where: {
        id: params.id,
      },
      include: {
        site: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                pricingTier: true,
              },
            },
          },
        },
        tickets: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10, // Latest 10 tickets
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


