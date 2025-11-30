import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Site API Route
 * 
 * GET: Fetch a single site with its machines
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const site = await prisma.site.findUnique({
      where: {
        id,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            pricingTier: true,
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
          orderBy: {
            createdAt: "desc",
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

    // Manually calculate count
    const siteWithCount = {
      ...site,
      _count: {
        machines: site.machines.length,
      },
    };

    return NextResponse.json(siteWithCount);
  } catch (error) {
    console.error("Error fetching site:", error);
    return NextResponse.json(
      { error: "Failed to fetch site" },
      { status: 500 }
    );
  }
}

// PATCH - Update a site
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, address, city, state, zipCode, primaryContactId } = body;

    // Get the current site to check companyId
    const currentSite = await prisma.site.findUnique({
      where: { id },
      select: { companyId: true },
    });

    if (!currentSite) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // If primaryContactId is provided, verify the user belongs to the company
    if (primaryContactId) {
      const user = await prisma.user.findUnique({
        where: { id: primaryContactId },
        select: { companyId: true },
      });

      if (!user || user.companyId !== currentSite.companyId) {
        return NextResponse.json(
          { error: "Primary contact must belong to the same company" },
          { status: 400 }
        );
      }
    }

    // Update the site
    const site = await prisma.site.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
        ...(zipCode !== undefined && { zipCode: zipCode || null }),
        ...(primaryContactId !== undefined && { primaryContactId: primaryContactId || null }),
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

    return NextResponse.json(siteWithCount);
  } catch (error: any) {
    console.error("Error updating site:", error);
    return NextResponse.json(
      { error: "Failed to update site", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}


