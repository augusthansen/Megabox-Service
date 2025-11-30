import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTicketInHubspot, createCompanyInHubspot } from "@/lib/hubspot";

/**
 * Tickets API Route
 * 
 * GET: Fetch all tickets (optionally filtered by status, priority, machineId, companyId)
 * POST: Create a new ticket
 */

// GET - Fetch tickets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const machineId = searchParams.get("machineId");
    const companyId = searchParams.get("companyId");
    const assignedToId = searchParams.get("assignedToId");

    // Build base filters
    const baseFilters: any = {};
    if (status) {
      baseFilters.status = status;
    }
    if (priority) {
      baseFilters.priority = priority;
    }
    if (machineId) {
      baseFilters.machineId = machineId;
    }
    if (companyId) {
      baseFilters.companyId = companyId;
    }
    
    // Build where clause
    let where: any;
    
    // For service techs, show ONLY tickets assigned to them
    if (assignedToId) {
      // Add assigned filter to base filters
      baseFilters.assignedToId = assignedToId;
      where = baseFilters;
    } else {
      // No assigned filter, just use base filters
      where = baseFilters;
    }

    // Debug logging
    console.log("Tickets API - Query params:", { status, priority, machineId, companyId, assignedToId });
    console.log("Tickets API - Where clause:", JSON.stringify(where, null, 2));

    // If filtering by assignedToId, also check how many tickets exist with that assignment
    if (assignedToId) {
      const assignedCount = await prisma.ticket.count({
        where: { assignedToId },
      });
      const totalCount = await prisma.ticket.count({});
      console.log(`Tickets API - Found ${assignedCount} tickets assigned to ${assignedToId} (out of ${totalCount} total tickets)`);
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

    console.log(`Tickets API - Found ${tickets.length} tickets`);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      companyId,
      siteId,
      machineId,
      subject,
      description,
      priority,
      status,
      machineDown,
    } = body;

    // Validate required fields
    if (!companyId || !siteId || !subject) {
      return NextResponse.json(
        { error: "Company ID, Site ID, and Subject are required" },
        { status: 400 }
      );
    }

    // Generate ticket number (format: TKT-YYYYMMDD-XXXX)
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const ticketNumber = `TKT-${dateStr}-${randomNum}`;

    // Get the site to check for primary contact
    const site = await prisma.site.findUnique({
      where: { id: siteId },
      select: {
        id: true,
        primaryContactId: true,
        companyId: true,
      },
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Get createdById from request body, or use site's primary contact, or find a default admin user
    let createdById = body.createdById;
    
    // If no createdById provided, use the site's primary contact if available
    if (!createdById && site.primaryContactId) {
      createdById = site.primaryContactId;
      console.log(`Using site's primary contact as ticket creator: ${createdById}`);
    }
    
    // If still no createdById, fallback to admin user
    if (!createdById) {
      // Fallback: find the first super_admin or service_tech user
      const creator = await prisma.user.findFirst({
        where: {
          role: {
            in: ["super_admin", "service_tech"],
          },
        },
      });

      if (!creator) {
        return NextResponse.json(
          { error: "No admin user found to create ticket" },
          { status: 500 }
        );
      }
      createdById = creator.id;
    }

    // Verify companyId matches site's companyId
    if (site.companyId !== companyId) {
      return NextResponse.json(
        { error: "Site does not belong to the specified company" },
        { status: 400 }
      );
    }

    // Get company and creator to find HubSpot IDs
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { 
        hubspotId: true,
        name: true,
        email: true,
        phone: true,
      },
    });

    const creator = await prisma.user.findUnique({
      where: { id: createdById },
      select: { hubspotId: true },
    });

    // Create ticket in HubSpot if API key is configured
    let hubspotTicket = null;
    let hubspotId = null;
    let hubspotCompanyId = company?.hubspotId || null;
    
    if (process.env.HUBSPOT_API_KEY) {
      try {
        // If company doesn't exist in HubSpot, create it first
        if (!hubspotCompanyId && company) {
          try {
            const hubspotCompany = await createCompanyInHubspot({
              name: company.name,
              email: company.email || undefined,
              phone: company.phone || undefined,
              hasServicePlan: true, // Assume service plan since they're creating tickets
            });
            
            hubspotCompanyId = hubspotCompany.id;
            
            // Update local company with HubSpot ID
            await prisma.company.update({
              where: { id: companyId },
              data: { hubspotId: hubspotCompanyId },
            });
            
            console.log(`Created company in HubSpot: ${hubspotCompany.id} for ${company.name}`);
          } catch (companyError) {
            console.error("Error creating company in HubSpot (continuing anyway):", companyError);
            // Continue without HubSpot company creation
          }
        }
        
        // Create ticket in HubSpot if we have a company ID
        if (hubspotCompanyId) {
          hubspotTicket = await createTicketInHubspot({
            subject,
            description: description || undefined,
            priority: priority || undefined,
            companyId: hubspotCompanyId,
            contactId: creator?.hubspotId || undefined, // Associate with contact if available
          });
          hubspotId = hubspotTicket.id;
          console.log(`Created ticket in HubSpot: ${hubspotId}`);
        }
      } catch (error) {
        console.error("Error creating ticket in HubSpot (continuing anyway):", error);
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
        createdById: createdById,
        subject,
        description: description || null,
        priority: priority || "medium",
        status: status || "open",
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

