import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSiteSchema, validateRequest } from "@/lib/validations";

/**
 * Sites API Route
 *
 * GET: Fetch all sites (optionally filtered by companyId)
 * POST: Create a new site
 */

// GET - Fetch sites
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

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
        _count: {
          select: {
            machines: true,
          },
        },
      },
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST - Create a new site
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
    const validation = validateRequest(createSiteSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, address, city, state, zipCode, companyId } = validation.data;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
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
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            machines: true,
          },
        },
      },
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}
