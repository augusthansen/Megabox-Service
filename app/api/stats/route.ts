import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Stats API Route
 * 
 * Returns dashboard statistics
 */

export async function GET() {
  try {
    const [customers, sites, machines, openTickets] = await Promise.all([
      prisma.company.count(),
      prisma.site.count(),
      prisma.machine.count(),
      prisma.ticket.count({
        where: {
          status: {
            in: ["open", "in_progress"],
          },
        },
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


