import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Customer Sites API
 * GET /api/customer/sites - Get all sites (facilities) for a customer's company
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required" },
        { status: 400 }
      );
    }

    // Get all sites for this company with machine counts and status
    const sites = await prisma.site.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        machines: {
          select: {
            id: true,
            name: true,
            status: true,
            isCurrentlyDown: true,
          },
        },
        floorPlan: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Transform the data to include machine counts
    const sitesWithStats = sites.map((site) => {
      const totalMachines = site.machines.length;
      const activeMachines = site.machines.filter(
        (m) => m.status === "active" && !m.isCurrentlyDown
      ).length;
      const downMachines = site.machines.filter(
        (m) => m.isCurrentlyDown || m.status === "down"
      ).length;
      const maintenanceMachines = site.machines.filter(
        (m) => m.status === "maintenance"
      ).length;

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        city: site.city,
        state: site.state,
        zipCode: site.zipCode,
        contactName: site.contactName,
        contactPhone: site.contactPhone,
        contactEmail: site.contactEmail,
        hasFloorPlan: !!site.floorPlan,
        machineStats: {
          total: totalMachines,
          active: activeMachines,
          down: downMachines,
          maintenance: maintenanceMachines,
        },
      };
    });

    return NextResponse.json(sitesWithStats);
  } catch (error) {
    console.error("Error fetching customer sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}
