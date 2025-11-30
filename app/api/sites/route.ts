import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Sites API Route
 * 
 * GET: Fetch all sites (optionally filtered by companyId)
 * POST: Create a new site
 */

// GET - Fetch sites
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get("companyId");

    const where = companyId ? { companyId } : {};

    const sites = await prisma.site.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        machines: {
          select: {
            id: true,
          },
        },
      },
    });

    // Manually calculate counts to avoid Prisma _count issues
    const sitesWithCounts = sites.map(site => ({
      ...site,
      _count: {
        machines: site.machines.length,
      },
    }));

    return NextResponse.json(sitesWithCounts);
  } catch (error: any) {
    console.error("Error fetching sites:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch sites", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create a new site
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, address, city, state, zipCode, companyId, primaryContactId } = body;

    // Validate required fields
    if (!name || !companyId) {
      return NextResponse.json(
        { error: "Site name and company ID are required" },
        { status: 400 }
      );
    }

    // If primaryContactId is provided, verify the user belongs to the company
    if (primaryContactId) {
      const user = await prisma.user.findUnique({
        where: { id: primaryContactId },
        select: { companyId: true },
      });

      if (!user || user.companyId !== companyId) {
        return NextResponse.json(
          { error: "Primary contact must belong to the same company" },
          { status: 400 }
        );
      }
    }

    // Create the site
    const site = await prisma.site.create({
      data: {
        name,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        companyId,
        primaryContactId: primaryContactId || null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        machines: {
          select: {
            id: true,
          },
        },
      },
    });

    // Manually calculate count
    const siteWithCount = {
      ...site,
      _count: {
        machines: site.machines.length,
      },
    };

    return NextResponse.json(siteWithCount, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}


