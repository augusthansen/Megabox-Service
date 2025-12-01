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
 * Returns array of HubSpot company objects
 */
export async function syncCompaniesFromHubspot() {
  try {
    const client = getHubspotClient();
    
    // Fetch all companies from HubSpot
    const response = await client.crm.companies.basicApi.getPage(100);
    
    return response.results.map((company: any) => ({
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
 * Returns array of HubSpot ticket objects
 */
export async function syncTicketsFromHubspot() {
  try {
    const client = getHubspotClient();
    
    // Fetch all tickets from HubSpot Service Hub
    // Note: HubSpot uses the tickets API for Service Hub
    const response = await client.crm.tickets.basicApi.getPage(100);
    
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
    // Note: Company associations should be added via HubSpot UI or webhooks
    const ticket = await client.crm.tickets.basicApi.create({ properties });
    
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


