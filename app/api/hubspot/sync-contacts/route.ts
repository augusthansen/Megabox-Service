import { NextResponse } from "next/server";
import { syncContactsFromHubspot } from "@/lib/hubspot";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { UserRole } from "@prisma/client";

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

        // Check if this is a service tech
        // Priority: 1) Contact Type = "Technician", 2) is_service_tech property, 3) user_role = "service_tech"
        const contactTypeIsTechnician = hubspotContact.contactType && 
          (hubspotContact.contactType.toLowerCase() === "technician" || 
           hubspotContact.contactType.toLowerCase() === "tech");
        const isServiceTech = contactTypeIsTechnician || 
          hubspotContact.isServiceTech || 
          hubspotContact.userRole === "service_tech";
        
        // Try to find associated company from HubSpot associations
        // Service techs don't require a company association
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
        
        // Determine user role
        let userRole: UserRole = UserRole.customer_admin; // Default role
        if (isServiceTech) {
          userRole = UserRole.service_tech;
        } else if (hubspotContact.userRole) {
          // Use user_role property if set (e.g., "customer_admin", "customer_tech", "super_admin")
          const validRoles = Object.values(UserRole);
          if (validRoles.includes(hubspotContact.userRole as UserRole)) {
            userRole = hubspotContact.userRole as UserRole;
          }
        }
        
        if (existingByHubspot) {
          // Update existing contact
          await prisma.user.update({
            where: { id: existingByHubspot.id },
            data: {
              email: hubspotContact.email,
              name: name,
              role: userRole, // Update role based on HubSpot property
              companyId: companyId || existingByHubspot.companyId, // Keep existing if new one is null
              // Don't update hubspotId since it's already set
            },
          });
          updated.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
            role: userRole,
          });
        } else if (existingByEmail) {
          // User exists with same email but no hubspotId - link them
          // Check if hubspotId is already taken by another user
          const hubspotIdTaken = await prisma.user.findUnique({
            where: { hubspotId: hubspotContact.hubspotId },
          });
          
          if (hubspotIdTaken && hubspotIdTaken.id !== existingByEmail.id) {
            throw new Error(`HubSpot ID ${hubspotContact.hubspotId} is already linked to another user`);
          }
          
          await prisma.user.update({
            where: { id: existingByEmail.id },
            data: {
              hubspotId: hubspotContact.hubspotId,
              name: name,
              role: userRole, // Update role based on HubSpot property
              companyId: companyId || existingByEmail.companyId,
            },
          });
          updated.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
            role: userRole,
            note: "Linked existing user to HubSpot contact",
          });
        } else {
          // For service techs, company association is optional
          // For customer roles, require company association
          if (!isServiceTech && !companyId) {
            skipped.push({ 
              id: hubspotContact.hubspotId, 
              email: hubspotContact.email,
              reason: "Not associated with a synced company (required for customer roles)" 
            });
            continue;
          }
          
          // For service techs, verify they don't need a company
          // For customer roles, verify company exists
          if (!isServiceTech && companyId) {

            // Verify company exists before creating user
            const company = await prisma.company.findUnique({
              where: { id: companyId },
              select: { id: true },
            });

            if (!company) {
              throw new Error(`Company with ID ${companyId} not found in database`);
            }
          }
          
          // Check if hubspotId is already taken
          const hubspotIdExists = await prisma.user.findUnique({
            where: { hubspotId: hubspotContact.hubspotId },
          });
          
          if (hubspotIdExists) {
            throw new Error(`HubSpot ID ${hubspotContact.hubspotId} is already linked to user ${hubspotIdExists.email}`);
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
              role: userRole, // Use role determined from HubSpot properties
              companyId: companyId, // null for service techs, company ID for customers
              hubspotId: hubspotContact.hubspotId,
              isActive: true,
            },
          });

          synced.push({
            id: hubspotContact.hubspotId,
            name: name,
            email: hubspotContact.email,
            role: userRole,
            company: companyId || "None (Service Tech)",
          });
        }
      } catch (error: any) {
        console.error(`Error syncing contact ${hubspotContact.hubspotId}:`, error);
        const errorMessage = error?.message || error?.toString() || "Unknown error";
        errors.push({
          id: hubspotContact.hubspotId,
          email: hubspotContact.email || "No email",
          error: errorMessage,
          details: error?.code || error?.statusCode || "No additional details",
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

