import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Customer API Route
 * 
 * GET: Fetch a single customer with their sites
 * PATCH: Update customer details
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("API: GET /api/customers/[id] called");
    const { id } = await params;
    console.log("API: Customer ID extracted:", id);
    
    if (!id) {
      console.log("API: No ID provided");
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }

    console.log("API: Querying database for customer:", id);
    
    // Fetch customer with sites
    const customer = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        sites: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            primaryContact: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
    
    if (!customer) {
      console.log("API: Customer not found for ID:", id);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }
    
    console.log("API: Customer found, fetching counts");
    
    // Fetch counts separately to avoid query issues
    const [sitesCount, usersCount, ticketsCount] = await Promise.all([
      prisma.site.count({ where: { companyId: id } }),
      prisma.user.count({ where: { companyId: id } }),
      prisma.ticket.count({ where: { companyId: id } }),
    ]);
    
    // Fetch machines count for each site
    const sitesWithCounts = await Promise.all(
      customer.sites.map(async (site) => {
        const machinesCount = await prisma.machine.count({
          where: { siteId: site.id },
        });
        return {
          ...site,
          _count: {
            machines: machinesCount,
          },
        };
      })
    );
    
    // Calculate total machines
    const totalMachines = sitesWithCounts.reduce(
      (sum, site) => sum + site._count.machines,
      0
    );

    if (!customer) {
      console.log("API: Customer not found for ID:", id);
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Build response with counts and converted Decimal types
    const customerWithCounts = {
      ...customer,
      sites: sitesWithCounts,
      pricePerMachine: Number(customer.pricePerMachine),
      hourlyRate: Number(customer.hourlyRate),
      currentMonthUsageHours: Number(customer.currentMonthUsageHours),
      currentMonthUsageCost: Number(customer.currentMonthUsageCost),
      _count: {
        sites: sitesCount,
        users: usersCount,
        tickets: ticketsCount,
        machines: totalMachines,
      },
    };

    console.log("API: Customer data prepared:", customer.name);
    return NextResponse.json(customerWithCounts);
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch customer",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, email, phone, pricingTier, pricePerMachine, hourlyRate } = body;

    // Update the customer
    const customer = await prisma.company.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(pricingTier && { pricingTier }),
        ...(pricePerMachine !== undefined && { pricePerMachine }),
        ...(hourlyRate !== undefined && { hourlyRate }),
      },
      include: {
        sites: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            _count: {
              select: {
                machines: true,
              },
            },
          },
        },
        _count: {
          select: {
            sites: true,
            users: true,
          },
        },
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}


