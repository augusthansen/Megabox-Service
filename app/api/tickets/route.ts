import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTicketInHubspot } from "@/lib/hubspot";
import { createTicketSchema, validateRequest } from "@/lib/validations";

/**
 * Tickets API Route
 *
 * GET: Fetch all tickets (optionally filtered by status, priority, machineId, companyId)
 * POST: Create a new ticket
 */

// GET - Fetch tickets
export async function GET(request: NextRequest) {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const machineId = searchParams.get("machineId");
    const companyId = searchParams.get("companyId");

    const where: Record<string, string> = {};

    if (status) {
      where.status = status;
    }
    if (priority) {
      where.priority = priority;
    }
    if (machineId) {
      where.machineId = machineId;
    }
    if (companyId) {
      where.companyId = companyId;
    }

    const tickets = await prisma.ticket.findMany({
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
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets" },
      { status: 500 }
    );
  }
}

// POST - Create a new ticket
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
    const validation = validateRequest(createTicketSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      companyId,
      siteId,
      machineId,
      createdById,
      subject,
      description,
      priority,
      machineDown,
    } = validation.data;

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, hubspotId: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Verify site exists
    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    // Generate ticket number (format: TKT-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const ticketNumber = `TKT-${dateStr}-${randomNum}`;

    // Create ticket in HubSpot if API key is configured
    let hubspotId = null;

    if (process.env.HUBSPOT_API_KEY && company.hubspotId) {
      try {
        const hubspotTicket = await createTicketInHubspot({
          subject,
          description: description || undefined,
          priority: priority || undefined,
          companyId: company.hubspotId,
        });
        hubspotId = hubspotTicket.id;
      } catch (error) {
        console.error(
          "Error creating ticket in HubSpot (continuing anyway):",
          error
        );
        // Continue creating ticket locally even if HubSpot fails
      }
    }

    // Create the ticket
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        hubspotId,
        companyId,
        siteId,
        machineId: machineId || null,
        createdById,
        subject,
        description: description || null,
        priority: priority || "medium",
        status: "open",
        machineDown: machineDown || false,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        machine: {
          select: {
            id: true,
            name: true,
            serialNumber: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "Failed to create ticket" },
      { status: 500 }
    );
  }
}
