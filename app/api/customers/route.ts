import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { createCustomerSchema, validateRequest } from "@/lib/validations";

/**
 * Customers API Route
 *
 * GET: Fetch all customers
 * POST: Create a new customer
 */

// GET - Fetch all customers
export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

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
    if (!prisma) {
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateRequest(createCustomerSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { name, pricingTier, pricePerMachine, hourlyRate, sites } =
      validation.data;

    // Set default pricing based on tier
    const tierDefaults = {
      basic: { pricePerMachine: 40, hourlyRate: 180 },
      standard: { pricePerMachine: 60, hourlyRate: 150 },
      mega: { pricePerMachine: 85, hourlyRate: 120 },
    };

    const tier = pricingTier || "basic";
    const defaults = tierDefaults[tier as keyof typeof tierDefaults] || tierDefaults.basic;

    // Create the customer with sites in a transaction
    const customer = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

