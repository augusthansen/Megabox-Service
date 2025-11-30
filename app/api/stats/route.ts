import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Stats API Route
 * 
 * Returns dashboard statistics
 * For service techs, only returns their assigned tickets
 */

export async function GET(request: NextRequest) {
  try {
    // Get user role from query params (passed from frontend)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("userRole");

    // Base ticket query
    const ticketWhere: any = {
      status: {
        in: ["open", "in_progress"],
      },
    };

    // For service techs, only count tickets assigned to them
    if (userRole === "service_tech" && userId) {
      ticketWhere.assignedToId = userId;
    }

    const [customers, sites, machines, openTickets] = await Promise.all([
      prisma.company.count(),
      prisma.site.count(),
      prisma.machine.count(),
      prisma.ticket.count({
        where: ticketWhere,
      }),
    ]);

    return NextResponse.json({
      customers,
      sites,
      machines,
      openTickets,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}


