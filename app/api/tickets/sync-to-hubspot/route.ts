import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTicketInHubspot, createCompanyInHubspot } from "@/lib/hubspot";

/**
 * Sync Local Tickets to HubSpot API
 * 
 * Finds all tickets without a hubspotId and creates them in HubSpot
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

    // Find all tickets without a hubspotId
    const ticketsToSync = await prisma.ticket.findMany({
      where: {
        hubspotId: null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            hubspotId: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            hubspotId: true,
          },
        },
      },
    });

    if (ticketsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All tickets are already synced to HubSpot",
        synced: 0,
        errors: 0,
        details: [],
      });
    }

    const synced = [];
    const errors = [];

    // Sync each ticket
    for (const ticket of ticketsToSync) {
      try {
        let hubspotCompanyId = ticket.company.hubspotId;

        // If company doesn't exist in HubSpot, create it first
        if (!hubspotCompanyId && ticket.company) {
          try {
            const hubspotCompany = await createCompanyInHubspot({
              name: ticket.company.name,
              email: ticket.company.email || undefined,
              phone: ticket.company.phone || undefined,
              hasServicePlan: true, // Assume service plan since they have tickets
            });

            hubspotCompanyId = hubspotCompany.id;

            // Update local company with HubSpot ID
            await prisma.company.update({
              where: { id: ticket.company.id },
              data: { hubspotId: hubspotCompanyId },
            });

            console.log(`Created company in HubSpot: ${hubspotCompanyId} for ${ticket.company.name}`);
          } catch (companyError: any) {
            console.error(`Error creating company in HubSpot for ticket ${ticket.ticketNumber}:`, companyError);
            errors.push({
              ticket: ticket.ticketNumber,
              error: `Failed to create company in HubSpot: ${companyError.message || String(companyError)}`,
            });
            continue; // Skip this ticket if company creation fails
          }
        }

        // Create ticket in HubSpot
        if (hubspotCompanyId) {
          console.log(`Attempting to create ticket ${ticket.ticketNumber} in HubSpot for company ${hubspotCompanyId}`);
          
          const hubspotTicket = await createTicketInHubspot({
            subject: ticket.subject,
            description: ticket.description || undefined,
            priority: ticket.priority || undefined,
            companyId: hubspotCompanyId,
            contactId: ticket.createdBy?.hubspotId || undefined,
          });

          if (!hubspotTicket || !hubspotTicket.id) {
            throw new Error("HubSpot ticket creation returned no ID");
          }

          const hubspotTicketId = hubspotTicket.id;
          console.log(`Updating local ticket ${ticket.id} with HubSpot ID: ${hubspotTicketId}`);

          // Update local ticket with HubSpot ID
          const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: { hubspotId: hubspotTicketId },
          });

          console.log(`✅ Local ticket updated. New hubspotId: ${updatedTicket.hubspotId}`);

          synced.push({
            ticket: ticket.ticketNumber,
            hubspotId: hubspotTicket.id,
            subject: ticket.subject,
          });

          console.log(`✅ Successfully synced ticket ${ticket.ticketNumber} to HubSpot: ${hubspotTicket.id}`);
        } else {
          errors.push({
            ticket: ticket.ticketNumber,
            error: "No HubSpot company ID available",
          });
        }
      } catch (error: any) {
        console.error(`❌ Error syncing ticket ${ticket.ticketNumber} to HubSpot:`, error);
        console.error("Error details:", {
          message: error.message,
          statusCode: error.statusCode,
          body: error.body,
          response: error.response,
        });
        errors.push({
          ticket: ticket.ticketNumber,
          error: error.message || String(error),
          details: error.statusCode ? `Status: ${error.statusCode}` : undefined,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      errors: errors.length,
      total: ticketsToSync.length,
      details: {
        synced,
        errors,
      },
    });
  } catch (error: any) {
    console.error("Error syncing tickets to HubSpot:", error);
    return NextResponse.json(
      { error: "Failed to sync tickets to HubSpot", details: error.message || String(error) },
      { status: 500 }
    );
  }
}

