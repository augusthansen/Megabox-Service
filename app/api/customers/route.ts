import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createCompanyInHubspot } from "@/lib/hubspot";

/**
 * Customers API Route
 * 
 * GET: Fetch all customers
 * POST: Create a new customer
 */

// GET - Fetch all customers
export async function GET() {
  try {
    const customers = await prisma.company.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sites: {
          select: {
            id: true,
          },
        },
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    // Manually calculate counts to avoid Prisma _count issues
    const customersWithCounts = customers.map(customer => ({
      ...customer,
      _count: {
        sites: customer.sites.length,
        users: customer.users.length,
      },
    }));

    return NextResponse.json(customersWithCounts);
  } catch (error: any) {
    console.error("Error fetching customers:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch customers", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, pricingTier, pricePerMachine, hourlyRate, sites, contacts, existingUserIds } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Set default pricing based on tier
    const tierDefaults = {
      basic: { pricePerMachine: 40, hourlyRate: 180 },
      standard: { pricePerMachine: 60, hourlyRate: 150 },
      mega: { pricePerMachine: 85, hourlyRate: 120 },
    };

    const tier = pricingTier || "basic";
    const defaults = tierDefaults[tier as keyof typeof tierDefaults] || tierDefaults.basic;

    // Create the customer with sites in a transaction
    const customer = await prisma.$transaction(async (tx) => {
      // Create company in HubSpot if API key is configured
      let hubspotId: string | null = null;
      if (process.env.HUBSPOT_API_KEY) {
        try {
          // Extract domain from email if available
          const domain = email.includes("@") ? email.split("@")[1] : undefined;
          
          const hubspotResult = await createCompanyInHubspot({
            name,
            email: email,
            phone: phone,
            domain: domain,
            hasServicePlan: true, // New customers added in app should have service plan
            servicePlanTier: tier,
          });
          hubspotId = hubspotResult.id;
          
          if (hubspotResult.exists) {
            console.log(`Company "${name}" already exists in HubSpot with ID: ${hubspotId}`);
          } else {
            console.log(`Created new company "${name}" in HubSpot with ID: ${hubspotId}`);
          }

          // Create contacts in HubSpot if provided
          if (contacts && Array.isArray(contacts) && contacts.length > 0 && hubspotId) {
            const { createContactInHubspot } = await import("@/lib/hubspot");
            for (const contact of contacts) {
              if (contact.email && contact.firstName && contact.lastName) {
                try {
                  await createContactInHubspot({
                    email: contact.email,
                    firstName: contact.firstName,
                    lastName: contact.lastName,
                    phone: contact.phone || undefined,
                    companyId: hubspotId,
                  });
                  console.log(`Created contact ${contact.email} in HubSpot`);
                } catch (contactError) {
                  console.error(`Error creating contact ${contact.email} in HubSpot:`, contactError);
                  // Continue with other contacts
                }
              }
            }
          }
        } catch (error) {
          console.error("Error creating company in HubSpot (continuing anyway):", error);
          // Continue creating customer locally even if HubSpot fails
        }
      }

      // Create the customer
      const newCustomer = await tx.company.create({
        data: {
          name,
          email: email,
          phone: phone,
          pricingTier: tier,
          pricePerMachine: pricePerMachine || defaults.pricePerMachine,
          hourlyRate: hourlyRate || defaults.hourlyRate,
          hubspotId: hubspotId, // Link to HubSpot if created
        },
      });

      // Associate existing users with the company
      if (existingUserIds && Array.isArray(existingUserIds) && existingUserIds.length > 0) {
        for (const userId of existingUserIds) {
          try {
            await tx.user.update({
              where: { id: userId },
              data: { companyId: newCustomer.id },
            });
            console.log(`Associated user ${userId} with company ${newCustomer.id}`);
          } catch (userError: any) {
            console.error(`Error associating user ${userId} with company:`, userError);
            // Continue with other users
          }
        }
      }

      // Create contacts as users if provided
      if (contacts && Array.isArray(contacts) && contacts.length > 0) {
        const { hash } = await import("bcryptjs");
        for (const contact of contacts) {
          if (contact.email && contact.firstName && contact.lastName) {
            try {
              // Check if user already exists by email
              const existingUser = await tx.user.findUnique({
                where: { email: contact.email },
              });

              if (existingUser) {
                // Update existing user to associate with company
                await tx.user.update({
                  where: { id: existingUser.id },
                  data: { companyId: newCustomer.id },
                });
                console.log(`Associated existing user ${contact.email} with company`);
              } else {
                // Generate a random password for the new contact
                const randomPassword = Math.random().toString(36).slice(-12);
                const passwordHash = await hash(randomPassword, 10);
                
                await tx.user.create({
                  data: {
                    email: contact.email,
                    passwordHash: passwordHash,
                    name: `${contact.firstName} ${contact.lastName}`.trim(),
                    role: "customer_admin", // Default role for contacts
                    companyId: newCustomer.id,
                    isActive: true,
                  },
                });
                console.log(`Created new user ${contact.email} for company`);
              }
            } catch (contactError: any) {
              console.error(`Error creating/associating contact user ${contact.email}:`, contactError);
              // Continue with other contacts
            }
          }
        }
      }

      // Create sites if provided
      if (sites && Array.isArray(sites) && sites.length > 0) {
        // Filter out sites with empty names (only name is required)
        const validSites = sites.filter((site: any) => site.name && site.name.trim() !== "");
        
        if (validSites.length > 0) {
          await tx.site.createMany({
            data: validSites.map((site: any) => ({
              name: site.name,
              address: site.address || null,
              city: site.city || null,
              state: site.state || null,
              zipCode: site.zipCode || null,
              companyId: newCustomer.id,
            })),
          });
        }
      }

      // Return customer with sites
      return await tx.company.findUnique({
        where: { id: newCustomer.id },
        include: {
          sites: true,
        },
      });
    });

    // Include HubSpot sync status in response
    const responseData = {
      ...customer,
      hubspotId: customer.hubspotId,
      hubspotSynced: !!customer.hubspotId,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

