import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        _count: {
          select: {
            sites: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST - Create a new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, pricingTier, pricePerMachine, hourlyRate, sites } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Company name is required" },
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
      // Create the customer
      const newCustomer = await tx.company.create({
        data: {
          name,
          pricingTier: tier,
          pricePerMachine: pricePerMachine || defaults.pricePerMachine,
          hourlyRate: hourlyRate || defaults.hourlyRate,
        },
      });

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

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}

