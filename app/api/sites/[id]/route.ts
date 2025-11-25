import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Site API Route
 * 
 * GET: Fetch a single site with its machines
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const site = await prisma.site.findUnique({
      where: {
        id: params.id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            pricingTier: true,
          },
        },
        machines: {
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            machines: true,
          },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(site);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}


