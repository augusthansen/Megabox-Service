import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createContactInHubspot } from "@/lib/hubspot";
import { hash } from "bcryptjs";

/**
 * Customer Users API Route
 * 
 * POST: Add users (new contacts or existing users) to a customer
 */

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await request.json();
    const { contacts, existingUserIds } = body;

    // Validate that customer exists
    const customer = await prisma.company.findUnique({
      where: { id: customerId },
      select: { id: true, name: true, hubspotId: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const syncedContacts = [];
    const failedContacts = [];
    const associatedUsers = [];

    // Process in a transaction
    await prisma.$transaction(async (tx) => {
      // Associate existing users with the company
      if (existingUserIds && Array.isArray(existingUserIds) && existingUserIds.length > 0) {
        for (const userId of existingUserIds) {
          try {
            await tx.user.update({
              where: { id: userId },
              data: { companyId: customerId },
            });
            associatedUsers.push(userId);
            console.log(`Associated user ${userId} with company ${customerId}`);
          } catch (userError: any) {
            console.error(`Error associating user ${userId} with company:`, userError);
            // Continue with other users
          }
        }
      }

      // Create new contacts as users if provided
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        for (const contact of contacts) {
          if (!contact.email || !contact.firstName || !contact.lastName) {
            failedContacts.push({ ...contact, error: "Missing required contact fields" });
            continue;
          }

          try {
            // Check if user already exists by email
            const existingUser = await tx.user.findUnique({
              where: { email: contact.email },
            });

            if (existingUser) {
              // Update existing user to associate with company
              await tx.user.update({
                where: { id: existingUser.id },
                data: { companyId: customerId },
              });
              syncedContacts.push({ ...contact, action: "associated" });
              console.log(`Associated existing user ${contact.email} with company`);
            } else {
              // Create new user
              let hubspotContactId: string | null = null;
              
              // Create contact in HubSpot if company is synced
              if (customer.hubspotId && process.env.HUBSPOT_API_KEY) {
                try {
                  const newHubspotContact = await createContactInHubspot({
                    email: contact.email,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    phone: contact.phone,
                    companyId: customer.hubspotId,
                  });
                  hubspotContactId = newHubspotContact.id;
                  console.log(`HubSpot contact created: ${hubspotContactId}`);
                } catch (contactHubspotError: any) {
                  console.error(`Error syncing contact ${contact.email} to HubSpot:`, contactHubspotError);
                  // Continue creating user locally even if HubSpot fails
                }
              }

              // Generate a random password for the new contact
              const randomPassword = Math.random().toString(36).slice(-12);
              const passwordHash = await hash(randomPassword, 10);

              await tx.user.create({
                data: {
                  email: contact.email,
                  passwordHash: passwordHash,
                  name: `${contact.firstName} ${contact.lastName}`.trim(),
                  role: "customer_admin", // Default role for new contacts
                  companyId: customerId,
                  hubspotId: hubspotContactId,
                  isActive: true,
                },
              });
              syncedContacts.push({ ...contact, action: "created" });
              console.log(`Created new user ${contact.email} for company`);
            }
          } catch (contactError: any) {
            console.error(`Error creating/associating contact user ${contact.email}:`, contactError);
            failedContacts.push({ ...contact, error: contactError.message });
          }
        }
      }
    });

    console.log("Customer Users API: Successfully processed users");
    console.log("  - Synced contacts:", syncedContacts.length);
    console.log("  - Associated users:", associatedUsers.length);
    console.log("  - Failed contacts:", failedContacts.length);
    
    return NextResponse.json({
      success: true,
      syncedContacts: syncedContacts.length,
      associatedUsers: associatedUsers.length,
      failedContacts: failedContacts.length,
      details: {
        syncedContacts,
        associatedUsers,
        failedContacts,
      },
    });
  } catch (error: any) {
    console.error("Error adding users to customer:", error);
    return NextResponse.json(
      { 
        error: "Failed to add users to customer",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

