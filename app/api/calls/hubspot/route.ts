import { NextRequest, NextResponse } from "next/server";
import { getHubspotCallingUrl, createCallActivityInHubspot } from "@/lib/hubspot";
import { prisma } from "@/lib/prisma";

/**
 * HubSpot Calling API Route
 * 
 * POST: Initiate a phone call through HubSpot
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticketId,
      phoneNumber,
      techId,
      contactId,
      companyId,
      direction = "OUTBOUND",
    } = body;

    if (!ticketId || !phoneNumber || !techId) {
      return NextResponse.json(
        { error: "Ticket ID, phone number, and tech ID are required" },
        { status: 400 }
      );
    }

    // Get ticket and related data
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        id: true,
        ticketNumber: true,
        hubspotId: true,
        companyId: true,
        company: {
          select: {
            hubspotId: true,
          },
        },
        createdBy: {
          select: {
            hubspotId: true,
          },
        },
        site: {
          select: {
            primaryContactId: true,
            primaryContact: {
              select: {
                hubspotId: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // Get HubSpot IDs
    const hubspotTicketId = ticket.hubspotId;
    const hubspotCompanyId = companyId || ticket.company?.hubspotId;
    
    // Try to get contact HubSpot ID from provided contactId, or site's primary contact, or ticket creator
    let hubspotContactId: string | undefined;
    if (contactId) {
      const contact = await prisma.user.findUnique({
        where: { id: contactId },
        select: { hubspotId: true },
      });
      hubspotContactId = contact?.hubspotId || undefined;
    } else if (ticket.site?.primaryContact?.hubspotId) {
      hubspotContactId = ticket.site.primaryContact.hubspotId;
    } else if (ticket.createdBy?.hubspotId) {
      hubspotContactId = ticket.createdBy.hubspotId;
    }

    // Get HubSpot calling URL
    const callingUrl = getHubspotCallingUrl(
      phoneNumber,
      hubspotContactId || undefined,
      hubspotTicketId || undefined
    );

    // Log the call initiation to HubSpot (before the call is made)
    let hubspotEngagementId: string | null = null;
    if (process.env.HUBSPOT_API_KEY) {
      try {
        const engagement = await createCallActivityInHubspot({
          contactId: hubspotContactId || undefined,
          companyId: hubspotCompanyId || undefined,
          ticketId: hubspotTicketId || undefined,
          phoneNumber,
          direction: direction as "INBOUND" | "OUTBOUND",
          notes: `Call initiated from ticket ${ticket.ticketNumber}`,
          subject: `Call: ${ticket.ticketNumber}`,
        });
        hubspotEngagementId = engagement?.id || null;
      } catch (error) {
        console.error("Error logging call to HubSpot (continuing anyway):", error);
        // Continue even if logging fails
      }
    }

    return NextResponse.json({
      success: true,
      callingUrl,
      hubspotEngagementId,
      message: "Call initiated. Use the callingUrl to open HubSpot's calling interface.",
    });
  } catch (error: any) {
    console.error("Error initiating HubSpot call:", error);
    return NextResponse.json(
      { 
        error: "Failed to initiate call",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

