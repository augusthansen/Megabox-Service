import { Client } from "@hubspot/api-client";

/**
 * HubSpot Integration Utilities
 * 
 * Handles syncing customers (companies) and tickets from HubSpot CRM and Service Hub
 */

let hubspotClient: Client | null = null;

/**
 * Get HubSpot client instance
 */
export function getHubspotClient(): Client {
  if (!hubspotClient) {
    const apiKey = process.env.HUBSPOT_API_KEY;
    if (!apiKey) {
      throw new Error("HUBSPOT_API_KEY is not set in environment variables");
    }
    hubspotClient = new Client({ accessToken: apiKey });
  }
  return hubspotClient;
}

/**
 * Sync companies from HubSpot CRM
 * Only syncs companies that have a service plan
 * Returns array of HubSpot company objects
 * 
 * @param filterByServicePlan - If true, only sync companies with has_service_plan = true
 */
export async function syncCompaniesFromHubspot(filterByServicePlan = true) {
  try {
    const client = getHubspotClient();
    
    // Fetch companies from HubSpot with optional filtering
    // If filtering, use search API to filter by custom property
    let companies: any[] = [];
    
    if (filterByServicePlan) {
      // Use search API to filter companies with service plan
      const searchResponse = await client.crm.companies.searchApi.doSearch({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "has_service_plan",
                operator: "EQ",
                value: "true",
              },
            ],
          },
        ],
        properties: ["name", "domain", "has_service_plan", "service_plan_tier"],
        limit: 100,
      });
      companies = searchResponse.results;
    } else {
      // Fetch all companies (no filter)
      const response = await client.crm.companies.basicApi.getPage(100);
      companies = response.results;
    }
    
    return companies.map((company: any) => ({
      hubspotId: company.id,
      name: company.properties.name || company.properties.domain || "Unknown Company",
      properties: company.properties,
    }));
  } catch (error) {
    console.error("Error syncing companies from HubSpot:", error);
    throw error;
  }
}

/**
 * Sync tickets from HubSpot Service Hub
 * Returns array of HubSpot ticket objects with company associations
 */
export async function syncTicketsFromHubspot() {
  try {
    const client = getHubspotClient();
    
    // Fetch all tickets from HubSpot Service Hub
    // Request associations to get linked companies
    const response = await client.crm.tickets.basicApi.getPage(
      100,
      undefined,
      ["subject", "hs_ticket_name", "content", "hs_ticket_description", "hs_ticket_priority", "hs_ticket_status", "createdate"],
      undefined,
      ["companies"]
    );
    
    return response.results.map((ticket: any) => ({
      hubspotId: ticket.id,
      subject: ticket.properties.subject || ticket.properties.hs_ticket_name || "No Subject",
      description: ticket.properties.content || ticket.properties.hs_ticket_description || null,
      priority: mapHubspotPriority(ticket.properties.hs_ticket_priority),
      status: mapHubspotStatus(ticket.properties.hs_ticket_status),
      createdAt: ticket.properties.createdate ? new Date(ticket.properties.createdate).toISOString() : new Date().toISOString(),
      properties: ticket.properties,
      associations: ticket.associations,
    }));
  } catch (error) {
    console.error("Error syncing tickets from HubSpot:", error);
    throw error;
  }
}

/**
 * Map HubSpot ticket priority to our priority enum
 */
function mapHubspotPriority(hubspotPriority: string | null | undefined): string {
  if (!hubspotPriority) return "medium";
  
  const priorityMap: Record<string, string> = {
    "LOW": "low",
    "MEDIUM": "medium",
    "HIGH": "high",
    "URGENT": "urgent",
  };
  
  return priorityMap[hubspotPriority.toUpperCase()] || "medium";
}

/**
 * Map HubSpot ticket status to our status enum
 */
function mapHubspotStatus(hubspotStatus: string | null | undefined): string {
  if (!hubspotStatus) return "open";
  
  const statusMap: Record<string, string> = {
    "NEW": "open",
    "OPEN": "open",
    "IN_PROGRESS": "in_progress",
    "WAITING": "on_hold",
    "CLOSED": "closed",
    "RESOLVED": "resolved",
  };
  
  return statusMap[hubspotStatus.toUpperCase()] || "open";
}

/**
 * Create a ticket in HubSpot Service Hub
 */
export async function createTicketInHubspot(ticketData: {
  subject: string;
  description?: string;
  priority?: string;
  companyId?: string;
  contactId?: string;
}) {
  try {
    const client = getHubspotClient();
    
    const properties: any = {
      subject: ticketData.subject,
      hs_ticket_name: ticketData.subject,
    };
    
    if (ticketData.description) {
      properties.content = ticketData.description;
      properties.hs_ticket_description = ticketData.description;
    }
    
    if (ticketData.priority) {
      const hubspotPriority = mapPriorityToHubspot(ticketData.priority);
      properties.hs_ticket_priority = hubspotPriority;
    }
    
    // Create the ticket
    const ticket = await client.crm.tickets.basicApi.create({
      properties,
      associations: ticketData.companyId ? [
        {
          to: { id: ticketData.companyId },
          types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }], // Company association
        },
      ] : undefined,
    });
    
    return ticket;
  } catch (error) {
    console.error("Error creating ticket in HubSpot:", error);
    throw error;
  }
}

/**
 * Map our priority to HubSpot priority
 */
function mapPriorityToHubspot(priority: string): string {
  const priorityMap: Record<string, string> = {
    "low": "LOW",
    "medium": "MEDIUM",
    "high": "HIGH",
    "urgent": "URGENT",
  };
  
  return priorityMap[priority.toLowerCase()] || "MEDIUM";
}

/**
 * Update ticket in HubSpot
 */
export async function updateTicketInHubspot(hubspotId: string, updates: {
  status?: string;
  priority?: string;
  subject?: string;
  description?: string;
}) {
  try {
    const client = getHubspotClient();
    
    const properties: any = {};
    
    if (updates.status) {
      properties.hs_ticket_status = mapStatusToHubspot(updates.status);
    }
    
    if (updates.priority) {
      properties.hs_ticket_priority = mapPriorityToHubspot(updates.priority);
    }
    
    if (updates.subject) {
      properties.subject = updates.subject;
      properties.hs_ticket_name = updates.subject;
    }
    
    if (updates.description) {
      properties.content = updates.description;
      properties.hs_ticket_description = updates.description;
    }
    
    const ticket = await client.crm.tickets.basicApi.update(hubspotId, { properties });
    
    return ticket;
  } catch (error) {
    console.error("Error updating ticket in HubSpot:", error);
    throw error;
  }
}

/**
 * Map our status to HubSpot status
 */
function mapStatusToHubspot(status: string): string {
  const statusMap: Record<string, string> = {
    "open": "NEW",
    "assigned": "OPEN",
    "in_progress": "IN_PROGRESS",
    "on_hold": "WAITING",
    "resolved": "RESOLVED",
    "closed": "CLOSED",
  };
  
  return statusMap[status.toLowerCase()] || "NEW";
}

/**
 * Get HubSpot ticket URL
 * Returns the URL to view the ticket in HubSpot
 */
export function getHubspotTicketUrl(hubspotId: string): string {
  // HubSpot ticket URLs follow this format:
  // https://app.hubspot.com/contacts/[PORTAL_ID]/record/0-5/[TICKET_ID]
  // We don't have portal ID readily available, so we'll use a simplified version
  // that should redirect correctly
  return `https://app.hubspot.com/contacts/ticket/${hubspotId}`;
}

/**
 * Get HubSpot company URL
 * Returns the URL to view the company in HubSpot
 */
export function getHubspotCompanyUrl(hubspotId: string): string {
  return `https://app.hubspot.com/contacts/company/${hubspotId}`;
}


