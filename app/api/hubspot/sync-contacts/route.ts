import { NextResponse } from "next/server";
import { syncContactsFromHubspot } from "@/lib/hubspot";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

/**
 * HubSpot Sync Contacts API
 * 
 * Syncs contacts from HubSpot CRM into our database as Users
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

    // Fetch contacts from HubSpot
    const hubspotContacts = await syncContactsFromHubspot();

    const synced = [];
    const updated = [];
    const skipped = [];
    const errors = [];

    // Sync each contact
    for (const hubspotContact of hubspotContacts) {
      try {
        // Skip contacts without email
        if (!hubspotContact.email) {
          skipped.push({ 
            id: hubspotContact.hubspotId, 
            reason: "No email address" 
          });
          continue;
        }

        // Check if contact already exists by hubspotId
        const existingByHubspot = await prisma.user.findUnique({
          where: { hubspotId: hubspotContact.hubspotId },
        });

        // Check if contact already exists by email
        const existingByEmail = await prisma.user.findUnique({
          where: { email: hubspotContact.email },
        });

        // Try to find associated company from HubSpot associations
        let companyId: string | null = null;
        if (hubspotContact.associations?.companies?.results?.length > 0) {
          const hubspotCompanyId = hubspotContact.associations.companies.results[0].id;
          const company = await prisma.company.findUnique({
            where: { hubspotId: hubspotCompanyId },
          });
          if (company) {
            companyId = company.id;
          }
        }

        // Prepare user data
        const name = `${hubspotContact.firstName} ${hubspotContact.lastName}`.trim() || hubspotContact.email;
        
        if (existingByHubspot) {
          // Update existing contact
          await prisma.user.update({
            where: { id: existingByHubspot.id },
            data: {
              email: hubspotContact.email,
              name: name,
              companyId: companyId,
              // Don't update hubspotId since it's already set
            },
          });
          updated.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
          });
        } else if (existingByEmail) {
          // User exists with same email but no hubspotId - link them
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              hubspotId: hubspotContact.hubspotId,
              name: name,
              companyId: companyId || existingByEmail.companyId,
            },
          });
          updated.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
            note: "Linked existing user to HubSpot contact",
          });
        } else {
          // Only create new users if they're associated with a company that has a service plan
          if (!companyId) {
            skipped.push({ 
              id: hubspotContact.hubspotId, 
              email: hubspotContact.email,
              reason: "Not associated with a synced company" 
            });
            continue;
          }

          // Create new user
          // Generate a random password (they'll need to reset it)
          const randomPassword = Math.random().toString(36).slice(-12);
          const passwordHash = await hash(randomPassword, 10);

          await prisma.user.create({
            data: {
              email: hubspotContact.email,
              passwordHash: passwordHash,
              name: name,
              role: "customer_admin", // Default role for HubSpot contacts
              companyId: companyId,
              hubspotId: hubspotContact.hubspotId,
              isActive: true,
            },
          });

          synced.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
            company: companyId,
          });
        }
      } catch (error: any) {
        console.error(`Error syncing contact ${hubspotContact.hubspotId}:`, error);
        errors.push({
          id: hubspotContact.hubspotId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: synced.length,
      updated: updated.length,
      skipped: skipped.length,
      errors: errors.length,
      details: {
        synced,
        updated,
        skipped: skipped.slice(0, 10), // Limit to first 10 for readability
        errors,
      },
    });
  } catch (error: any) {
    console.error("Error syncing contacts from HubSpot:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync contacts from HubSpot" },
      { status: 500 }
    );
  }
}

