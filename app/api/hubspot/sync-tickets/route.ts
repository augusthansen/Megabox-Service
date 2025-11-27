import { NextResponse } from "next/server";
import { syncTicketsFromHubspot } from "@/lib/hubspot";
import { prisma } from "@/lib/prisma";

/**
 * HubSpot Sync Tickets API
 * 
 * Syncs tickets from HubSpot Service Hub into our database
 */

export async function POST() {
  try {
    // Check if HubSpot API key is configured
    if (!process.env.HUBSPOT_API_KEY) {
      return NextResponse.json(
        { error: "HubSpot API key is not configured. Please set HUBSPOT_API_KEY in your environment variables." },
        { status: 400 }
      );
    }

    // Fetch tickets from HubSpot
    const hubspotTickets = await syncTicketsFromHubspot();

    const synced = [];
    const updated = [];
    const errors = [];

    // Get the first admin user for createdBy (required field)
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ["super_admin", "service_tech"],
        },
      },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "No admin user found. Please create an admin user first." },
        { status: 500 }
      );
    }

    // Sync each ticket
    for (const hubspotTicket of hubspotTickets) {
      try {
        // Check if ticket already exists by hubspotId
        const existing = await prisma.ticket.findUnique({
          where: { hubspotId: hubspotTicket.hubspotId },
        });

        // Try to find associated company from HubSpot associations
        let companyId: string | null = null;
        if (hubspotTicket.associations?.companies?.results?.length > 0) {
          const hubspotCompanyId = hubspotTicket.associations.companies.results[0].id;
          const company = await prisma.company.findUnique({
            where: { hubspotId: hubspotCompanyId },
          });
          if (company) {
            companyId = company.id;
          }
        }

        // Try to find associated contact from HubSpot associations
        let createdByUserId: string = adminUser.id; // Default to admin
        if (hubspotTicket.associations?.contacts?.results?.length > 0) {
          const hubspotContactId = hubspotTicket.associations.contacts.results[0].id;
          const user = await prisma.user.findUnique({
            where: { hubspotId: hubspotContactId },
          });
          if (user) {
            createdByUserId = user.id;
          }
        }

        // If no company found, try to get the first company (fallback)
        if (!companyId) {
          const firstCompany = await prisma.company.findFirst();
          if (firstCompany) {
            companyId = firstCompany.id;
          }
        }

        if (!companyId) {
          errors.push({ ticket: hubspotTicket.subject, error: "No company found" });
          continue;
        }

        // Get the first site for the company (required field)
        const site = await prisma.site.findFirst({
          where: { companyId },
        });

        if (!site) {
          errors.push({ ticket: hubspotTicket.subject, error: "No site found for company" });
          continue;
        }

        // Generate ticket number if not exists
        const ticketNumber = existing?.ticketNumber || 
          `TKT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

        if (existing) {
          // Update existing ticket
          await prisma.ticket.update({
            where: { id: existing.id },
            data: {
              subject: hubspotTicket.subject,
              description: hubspotTicket.description,
              priority: hubspotTicket.priority as any,
              status: hubspotTicket.status as any,
            },
          });
          updated.push(hubspotTicket.subject);
        } else {
          // Create new ticket
          await prisma.ticket.create({
            data: {
              hubspotId: hubspotTicket.hubspotId,
              ticketNumber,
              companyId,
              siteId: site.id,
              createdById: createdByUserId, // Use the contact if found, otherwise admin
              subject: hubspotTicket.subject,
              description: hubspotTicket.description,
              priority: hubspotTicket.priority as any,
              status: hubspotTicket.status as any,
            },
          });
          synced.push(hubspotTicket.subject);
        }
      } catch (error) {
        console.error(`Error syncing ticket ${hubspotTicket.subject}:`, error);
        errors.push({ ticket: hubspotTicket.subject, error: String(error) });
      }
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      updated: updated.length,
      errors: errors.length,
      details: {
        synced,
        updated,
        errors,
      },
    });
  } catch (error) {
    console.error("Error syncing tickets from HubSpot:", error);
    return NextResponse.json(
      { error: "Failed to sync tickets from HubSpot", details: String(error) },
      { status: 500 }
    );
  }
}


