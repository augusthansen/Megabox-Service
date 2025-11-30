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
                operator: "EQ" as any,
                value: "true",
              },
            ],
          },
        ],
        properties: ["name", "domain", "phone", "email", "has_service_plan", "service_plan_tier"],
        limit: 100,
      });
      companies = searchResponse.results;
    } else {
      // Fetch all companies (no filter)
      const response = await client.crm.companies.basicApi.getPage(100, undefined, [
        "name",
        "domain",
        "phone",
        "email",
        "has_service_plan",
        "service_plan_tier",
      ]);
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
 * Returns array of HubSpot ticket objects with company and contact associations
 */
export async function syncTicketsFromHubspot() {
  try {
    const client = getHubspotClient();
    
    // Fetch all tickets from HubSpot Service Hub
    // Request associations to get linked companies and contacts
    const response = await client.crm.tickets.basicApi.getPage(
      100,
      undefined,
      ["subject", "hs_ticket_name", "content", "hs_ticket_description", "hs_ticket_priority", "hs_ticket_status", "createdate"],
      undefined,
      ["companies", "contacts"]
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
    
    // Build associations array
    const associations: any[] = [];
    
    // Add company association (type ID 16 for ticket-to-company)
    if (ticketData.companyId) {
      associations.push({
        to: { id: ticketData.companyId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }], // Ticket to Company
      });
    }
    
    // Add contact association (type ID 16 for ticket-to-contact)
    if (ticketData.contactId) {
      associations.push({
        to: { id: ticketData.contactId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }], // Ticket to Contact
      });
    }
    
    console.log("Creating ticket in HubSpot with:", {
      subject: ticketData.subject,
      companyId: ticketData.companyId,
      contactId: ticketData.contactId,
      associationsCount: associations.length,
    });
    
    // Create the ticket
    const ticket = await client.crm.tickets.basicApi.create({
      properties,
      associations: associations.length > 0 ? associations : undefined,
    });
    
    console.log("Ticket created in HubSpot:", {
      id: ticket.id,
      subject: ticket.properties?.subject || ticket.properties?.hs_ticket_name,
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

/**
 * Get HubSpot contact URL
 * Returns the URL to view the contact in HubSpot
 */
export function getHubspotContactUrl(hubspotId: string): string {
  return `https://app.hubspot.com/contacts/contact/${hubspotId}`;
}

/**
 * Sync contacts from HubSpot CRM
 * Only syncs contacts associated with companies that have a service plan
 * Returns array of HubSpot contact objects
 */
export async function syncContactsFromHubspot() {
  try {
    const client = getHubspotClient();
    
    // Fetch contacts from HubSpot with company associations
    // Include custom properties to identify service techs
    // Check for: Contact Type (dropdown), is_service_tech, user_role
    const response = await client.crm.contacts.basicApi.getPage(
      100,
      undefined,
      ["firstname", "lastname", "email", "phone", "jobtitle", "contact_type", "is_service_tech", "user_role"]
    );
    
    // Fetch associations separately for each contact if needed
    const contactsWithAssociations = await Promise.all(
      response.results.map(async (contact: any) => {
        try {
          // Get company associations for this contact
          const associations = await (client.crm.contacts as any).associationsApi.getAll(
            contact.id,
            "companies"
          );
          return {
            ...contact,
            associations: {
              companies: {
                results: associations.results || [],
              },
            },
          };
        } catch (err) {
          // If associations fail, continue without them
          console.warn(`Could not fetch associations for contact ${contact.id}:`, err);
          return {
            ...contact,
            associations: { companies: { results: [] } },
          };
        }
      })
    );
    
    return contactsWithAssociations.map((contact: any) => ({
      hubspotId: contact.id,
      firstName: contact.properties.firstname || "",
      lastName: contact.properties.lastname || "",
      email: contact.properties.email || null,
      phone: contact.properties.phone || null,
      jobTitle: contact.properties.jobtitle || null,
      contactType: contact.properties.contact_type || null, // User's existing "Contact Type" property
      isServiceTech: contact.properties.is_service_tech === "true" || contact.properties.is_service_tech === true,
      userRole: contact.properties.user_role || null, // Alternative: use user_role property
      properties: contact.properties,
      associations: contact.associations,
    }));
  } catch (error) {
    console.error("Error syncing contacts from HubSpot:", error);
    throw error;
  }
}

/**
 * Search for companies in HubSpot by domain
 * Returns matching companies with their properties
 */
export async function searchCompaniesByDomain(domain: string) {
  try {
    const client = getHubspotClient();
    
    // Search for companies with matching domain
    const searchResponse = await client.crm.companies.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "domain",
              operator: "EQ" as any,
              value: domain,
            },
          ],
        },
      ],
      properties: [
        "name",
        "domain",
        "phone",
        "email",
        "has_service_plan",
        "service_plan_tier",
      ],
      limit: 10,
    });
    
    if (!searchResponse.results || searchResponse.results.length === 0) {
      return [];
    }
    
    return searchResponse.results.map((company: any) => ({
      hubspotId: company.id,
      name: company.properties.name || company.properties.domain || "Unknown Company",
      domain: company.properties.domain || null,
      email: company.properties.email || null,
      phone: company.properties.phone || null,
      hasServicePlan: company.properties.has_service_plan === "true",
      servicePlanTier: company.properties.service_plan_tier || null,
      properties: company.properties,
    }));
  } catch (error) {
    console.error("Error searching companies by domain:", error);
    throw error;
  }
}

/**
 * Create a company in HubSpot
 * Checks if company already exists by name before creating
 */
export async function createCompanyInHubspot(companyData: {
  name: string;
  email?: string;
  phone?: string;
  domain?: string;
  hasServicePlan?: boolean;
  servicePlanTier?: string;
}): Promise<{ id: string; exists: boolean }> {
  try {
    const client = getHubspotClient();
    
    // First, check if company already exists by name
    const searchResponse = await client.crm.companies.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "name",
              operator: "EQ" as any,
              value: companyData.name,
            },
          ],
        },
      ],
      properties: ["name", "domain"],
      limit: 1,
    });
    
    if (searchResponse.results && searchResponse.results.length > 0) {
      // Company already exists
      return {
        id: searchResponse.results[0].id,
        exists: true,
      };
    }
    
    // Create new company
    const properties: any = {
      name: companyData.name,
    };
    
    if (companyData.email) {
      properties.email = companyData.email;
    }
    
    if (companyData.phone) {
      properties.phone = companyData.phone;
    }
    
    if (companyData.domain) {
      properties.domain = companyData.domain;
    }
    
    // Set service plan properties if provided
    if (companyData.hasServicePlan !== undefined) {
      properties.has_service_plan = companyData.hasServicePlan.toString();
    }
    
    if (companyData.servicePlanTier) {
      properties.service_plan_tier = companyData.servicePlanTier;
    }
    
    const company = await client.crm.companies.basicApi.create({
      properties,
    });
    
    return {
      id: company.id,
      exists: false,
    };
  } catch (error: any) {
    console.error("Error creating company in HubSpot:", error);
    // If error is because company already exists, try to find it
    if (error.message?.includes("already exists") || error.statusCode === 409) {
      try {
        const hubspotClient = getHubspotClient();
        const searchResponse = await hubspotClient.crm.companies.searchApi.doSearch({
          filterGroups: [
            {
              filters: [
                {
                  propertyName: "name",
                  operator: "EQ" as any,
                  value: companyData.name,
                },
              ],
            },
          ],
          properties: ["name"],
          limit: 1,
        });
        
        if (searchResponse.results && searchResponse.results.length > 0) {
          return {
            id: searchResponse.results[0].id,
            exists: true,
          };
        }
      } catch (searchError) {
        // Fall through to throw original error
      }
    }
    throw error;
  }
}

/**
 * Create a contact in HubSpot
 */
export async function createContactInHubspot(contactData: {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyId?: string;
}) {
  try {
    const client = getHubspotClient();
    
    const properties: any = {
      email: contactData.email,
      firstname: contactData.firstName,
      lastname: contactData.lastName,
    };
    
    if (contactData.phone) {
      properties.phone = contactData.phone;
    }
    
    // Create the contact
    const contact = await client.crm.contacts.basicApi.create({
      properties,
      associations: contactData.companyId ? [
        {
          to: { id: contactData.companyId },
          types: [{ associationCategory: "HUBSPOT_DEFINED" as any, associationTypeId: 1 }], // Company association
        },
      ] as any : undefined,
    });
    
    return contact;
  } catch (error) {
    console.error("Error creating contact in HubSpot:", error);
    throw error;
  }
}

/**
 * Create a call activity in HubSpot
 * Logs a phone call to HubSpot and associates it with a contact/company/ticket
 */
export async function createCallActivityInHubspot(callData: {
  contactId?: string;
  companyId?: string;
  ticketId?: string;
  phoneNumber: string;
  direction: "INBOUND" | "OUTBOUND";
  duration?: number; // Duration in seconds
  notes?: string;
  subject?: string;
}): Promise<{ id: string } | null> {
  try {
    const client = getHubspotClient();
    
    // HubSpot uses Engagements API for call logging
    // Create a note engagement that represents the call
    
    // Build associations
    const associations: any[] = [];
    
    if (callData.contactId) {
      associations.push({
        to: { id: callData.contactId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }], // Contact association
      });
    }
    
    if (callData.companyId) {
      associations.push({
        to: { id: callData.companyId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 279 }], // Company association
      });
    }
    
    if (callData.ticketId) {
      associations.push({
        to: { id: callData.ticketId },
        types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 16 }], // Ticket association
      });
    }
    
    // Create a note engagement for the call
    const noteBody = callData.notes 
      ? `Phone call to ${callData.phoneNumber}${callData.duration ? ` (Duration: ${callData.duration}s)` : ""}\n\n${callData.notes}`
      : `Phone call to ${callData.phoneNumber}${callData.duration ? ` (Duration: ${callData.duration}s)` : ""}`;
    
    // Try to create engagement (requires Engagements scope)
    // If this fails, we'll continue without logging - calls will still work
    try {
      const engagement = await (client.crm as any).engagements?.basicApi?.create({
        engagement: {
          type: "NOTE",
          active: true,
        },
        associations: associations.length > 0 ? associations : undefined,
        metadata: {
          body: noteBody,
        },
      });
      
      console.log("Call activity logged to HubSpot:", {
        engagementId: engagement.id,
        phoneNumber: callData.phoneNumber,
        direction: callData.direction,
      });
      
      return { id: engagement.id };
    } catch (engagementError: any) {
      // If engagements API fails (missing scope), try to add a note to the ticket instead
      if (callData.ticketId) {
        try {
          // Add call info as a note in the ticket description or update ticket
          const ticket = await client.crm.tickets.basicApi.getById(callData.ticketId, ["content"]);
          const existingContent = ticket.properties?.content || "";
          const callNote = `\n\n[Call Log] ${new Date().toLocaleString()}: ${callData.direction} call to ${callData.phoneNumber}${callData.duration ? ` (${callData.duration}s)` : ""}${callData.notes ? `\nNotes: ${callData.notes}` : ""}`;
          
          await client.crm.tickets.basicApi.update(callData.ticketId, {
            properties: {
              content: existingContent + callNote,
            },
          });
          
          console.log("Call logged to ticket notes (Engagements scope not available)");
          return { id: `ticket-note-${callData.ticketId}` };
        } catch (ticketError) {
          console.warn("Could not log call to ticket either:", ticketError);
        }
      }
      
      // If all logging fails, just log a warning but don't block the call
      console.warn("Call logging unavailable - Engagements scope may not be configured. Call will proceed anyway.");
      return null;
    }
  } catch (error) {
    console.error("Error in call logging function:", error);
    // Don't throw - allow call to proceed even if logging fails
    return null;
  }
}

/**
 * Get HubSpot calling interface URL
 * Returns a URL that can be used to initiate a call through HubSpot's calling interface
 * Note: HubSpot doesn't have a direct calling URL, so we'll open the contact page
 * or use tel: links as fallback
 */
export function getHubspotCallingUrl(phoneNumber: string, contactId?: string, ticketId?: string): string | null {
  // HubSpot doesn't have a direct "calling" URL endpoint
  // Instead, we can:
  // 1. Open the contact page (if we have contactId) - user can initiate call from there
  // 2. Return null to use tel: links as fallback
  
  if (contactId) {
    // Open the contact page in HubSpot - user can initiate call from there
    return `https://app.hubspot.com/contacts/${contactId}`;
  }
  
  // If no contact ID, return null to use tel: link fallback
  return null;
}


