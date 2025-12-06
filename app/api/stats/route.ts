import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Stats API Route
 *
 * Returns dashboard statistics including detailed metrics
 * For service techs, only returns their assigned tickets
 */

export async function GET(request: NextRequest) {
  try {
    // Get user role from query params (passed from frontend)
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const userRole = searchParams.get("userRole");
    const detailed = searchParams.get("detailed") === "true";

    // Base ticket query for open tickets
    const openTicketWhere: any = {
      status: {
        in: ["open", "assigned", "in_progress", "on_hold"],
      },
    };

    // For service techs, only count tickets assigned to them
    if (userRole === "service_tech" && userId) {
      openTicketWhere.assignedToId = userId;
    }

    const [customers, sites, machines, openTickets] = await Promise.all([
      prisma.company.count(),
      prisma.site.count(),
      prisma.machine.count(),
      prisma.ticket.count({
        where: openTicketWhere,
      }),
    ]);

    // Basic stats for quick load
    const basicStats = {
      customers,
      sites,
      machines,
      openTickets,
    };

    // If detailed stats not requested, return basic stats
    if (!detailed) {
      return NextResponse.json(basicStats);
    }

    // Detailed stats for dashboard
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User filter for service techs
    const userFilter = userRole === "service_tech" && userId ? { assignedToId: userId } : {};

    const [
      ticketsToday,
      ticketsThisWeek,
      ticketsThisMonth,
      resolvedThisWeek,
      resolvedThisMonth,
      ticketsByStatus,
      ticketsByPriority,
      urgentOpenTickets,
      machineDownTickets,
      avgSatisfaction,
      recentTickets,
      ticketTrend,
    ] = await Promise.all([
      // Tickets created today
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfToday },
          ...userFilter,
        },
      }),

      // Tickets created this week
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfWeek },
          ...userFilter,
        },
      }),

      // Tickets created this month
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfMonth },
          ...userFilter,
        },
      }),

      // Resolved this week
      prisma.ticket.count({
        where: {
          status: { in: ["resolved", "closed"] },
          resolvedAt: { gte: startOfWeek },
          ...userFilter,
        },
      }),

      // Resolved this month
      prisma.ticket.count({
        where: {
          status: { in: ["resolved", "closed"] },
          resolvedAt: { gte: startOfMonth },
          ...userFilter,
        },
      }),

      // Group by status
      prisma.ticket.groupBy({
        by: ["status"],
        _count: { id: true },
        where: userFilter,
      }),

      // Group by priority (open tickets only)
      prisma.ticket.groupBy({
        by: ["priority"],
        _count: { id: true },
        where: {
          status: { in: ["open", "assigned", "in_progress", "on_hold"] },
          ...userFilter,
        },
      }),

      // Urgent open tickets
      prisma.ticket.count({
        where: {
          priority: "urgent",
          status: { in: ["open", "assigned", "in_progress", "on_hold"] },
          ...userFilter,
        },
      }),

      // Machine down tickets
      prisma.ticket.count({
        where: {
          machineDown: true,
          status: { in: ["open", "assigned", "in_progress", "on_hold"] },
          ...userFilter,
        },
      }),

      // Average satisfaction rating (all time)
      prisma.ticket.aggregate({
        _avg: { satisfactionRating: true },
        where: {
          satisfactionRating: { not: null },
          ...userFilter,
        },
      }),

      // Recent tickets (5 most recent)
      prisma.ticket.findMany({
        where: userFilter,
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          company: { select: { name: true } },
          assignedTo: { select: { name: true } },
        },
      }),

      // Ticket trend (last 7 days)
      getTicketTrendByDay(userFilter, 7),
    ]);

    // Transform groupBy results to objects
    const statusCounts = ticketsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const priorityCounts = ticketsByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      ...basicStats,
      detailed: {
        ticketsToday,
        ticketsThisWeek,
        ticketsThisMonth,
        resolvedThisWeek,
        resolvedThisMonth,
        statusCounts,
        priorityCounts,
        urgentOpenTickets,
        machineDownTickets,
        avgSatisfactionRating: avgSatisfaction._avg.satisfactionRating,
        recentTickets,
        ticketTrend,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

// Helper to get ticket counts by day for the last N days
async function getTicketTrendByDay(userFilter: any, days: number) {
  const result: { date: string; created: number; resolved: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const [created, resolved] = await Promise.all([
      prisma.ticket.count({
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
          ...userFilter,
        },
      }),
      prisma.ticket.count({
        where: {
          resolvedAt: { gte: startOfDay, lt: endOfDay },
          ...userFilter,
        },
      }),
    ]);

    result.push({
      date: startOfDay.toISOString().split("T")[0],
      created,
      resolved,
    });
  }

  return result;
}


