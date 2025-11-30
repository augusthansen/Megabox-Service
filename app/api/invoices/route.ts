import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Invoices API Routes
 * Handles invoice listing and creation
 */

// GET - List all invoices
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const status = searchParams.get("status");
    const billingPeriod = searchParams.get("billingPeriod");

    const where: any = {};
    if (companyId) {
      where.companyId = companyId;
    }
    if (status) {
      where.status = status;
    }
    if (billingPeriod) {
      where.billingPeriod = billingPeriod;
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            pricingTier: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal types to numbers for JSON serialization
    const serializedInvoices = invoices.map((invoice) => ({
      ...invoice,
      subscriptionFee: Number(invoice.subscriptionFee),
      usageHours: Number(invoice.usageHours),
      usageFee: Number(invoice.usageFee),
      escalationFees: Number(invoice.escalationFees),
      travelExpenses: Number(invoice.travelExpenses),
      totalAmount: Number(invoice.totalAmount),
    }));

    return NextResponse.json(serializedInvoices);
  } catch (error: any) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices", details: error?.message },
      { status: 500 }
    );
  }
}

// POST - Create a new invoice
// Automatically calculates from sites (machines) and tickets (usage, escalation, travel)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, billingPeriod, status = "draft" } = body;

    // Validate required fields
    if (!companyId || !billingPeriod) {
      return NextResponse.json(
        { error: "Company ID and billing period are required" },
        { status: 400 }
      );
    }

    // Parse billing period to get date range
    const [year, month] = billingPeriod.split("-");
    const periodStart = new Date(parseInt(year), parseInt(month) - 1, 1);
    const periodEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    // Get company with pricing info
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        pricingTier: true,
        pricePerMachine: true,
        hourlyRate: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Get all sites for this company with machine counts
    const sites = await prisma.site.findMany({
      where: { companyId, isActive: true },
      include: {
        machines: {
          where: {
            // Get all machines for active sites
          },
        },
      },
    });

    // Get all tickets for this company in the billing period
    const tickets = await prisma.ticket.findMany({
      where: {
        companyId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd,
        },
        invoiceId: null, // Only include tickets not already invoiced
      },
      include: {
        site: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate totals per site
    let totalMachineCount = 0;
    let totalSubscriptionFee = new Decimal(0);
    let totalUsageHours = new Decimal(0);
    let totalUsageFee = new Decimal(0);
    let totalEscalationFees = new Decimal(0);
    let totalTravelExpenses = new Decimal(0);

    const lineItemsData: Array<{
      siteId: string;
      machineCount: number;
      subscriptionFee: Decimal;
      usageHours: Decimal;
      usageFee: Decimal;
      escalationFees: Decimal;
      travelExpenses: Decimal;
      subtotal: Decimal;
    }> = [];

    // Process each site
    for (const site of sites) {
      const siteMachineCount = site.machines.length;
      totalMachineCount += siteMachineCount;

      // Calculate subscription fee for this site
      const siteSubscriptionFee = new Decimal(company.pricePerMachine).times(
        siteMachineCount
      );
      totalSubscriptionFee = totalSubscriptionFee.plus(siteSubscriptionFee);

      // Get tickets for this site in the billing period
      const siteTickets = tickets.filter((t) => t.siteId === site.id);

      // Calculate usage from tickets
      let siteUsageHours = new Decimal(0);
      let siteUsageFee = new Decimal(0);
      let siteEscalationFees = new Decimal(0);
      let siteTravelExpenses = new Decimal(0);

      for (const ticket of siteTickets) {
        // Convert totalMinutes to hours
        const ticketHours = new Decimal(ticket.totalMinutes || 0).dividedBy(60);
        siteUsageHours = siteUsageHours.plus(ticketHours);

        // Calculate usage fee from ticket cost or hours × rate
        const ticketUsageFee = ticket.totalCost
          ? new Decimal(ticket.totalCost)
          : ticketHours.times(company.hourlyRate || 180);
        siteUsageFee = siteUsageFee.plus(ticketUsageFee);

        // Add escalation and travel from ticket
        if (ticket.escalationFees) {
          siteEscalationFees = siteEscalationFees.plus(
            new Decimal(ticket.escalationFees)
          );
        }
        if (ticket.travelExpenses) {
          siteTravelExpenses = siteTravelExpenses.plus(
            new Decimal(ticket.travelExpenses)
          );
        }
      }

      totalUsageHours = totalUsageHours.plus(siteUsageHours);
      totalUsageFee = totalUsageFee.plus(siteUsageFee);
      totalEscalationFees = totalEscalationFees.plus(siteEscalationFees);
      totalTravelExpenses = totalTravelExpenses.plus(siteTravelExpenses);

      // Calculate subtotal for this site
      const siteSubtotal = siteSubscriptionFee
        .plus(siteUsageFee)
        .plus(siteEscalationFees)
        .plus(siteTravelExpenses);

      lineItemsData.push({
        siteId: site.id,
        machineCount: siteMachineCount,
        subscriptionFee: siteSubscriptionFee,
        usageHours: siteUsageHours,
        usageFee: siteUsageFee,
        escalationFees: siteEscalationFees,
        travelExpenses: siteTravelExpenses,
        subtotal: siteSubtotal,
      });
    }

    // Validate that we have at least one site
    if (sites.length === 0) {
      return NextResponse.json(
        { error: "No active sites found for this company. Please add at least one site before creating an invoice." },
        { status: 400 }
      );
    }

    // Calculate total invoice amount
    const totalAmount = totalSubscriptionFee
      .plus(totalUsageFee)
      .plus(totalEscalationFees)
      .plus(totalTravelExpenses);

    // Generate invoice number
    const yearMonth = billingPeriod.replace("-", "");
    const existingInvoices = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${yearMonth}`,
        },
      },
    });
    const invoiceNumber = `INV-${yearMonth}-${String(
      existingInvoices + 1
    ).padStart(4, "0")}`;

    // Create invoice with line items and link tickets in a transaction
    const invoice = await prisma.$transaction(async (tx) => {
      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          companyId,
          invoiceNumber,
          billingPeriod,
          machineCount: totalMachineCount,
          subscriptionFee: totalSubscriptionFee,
          usageHours: totalUsageHours,
          usageFee: totalUsageFee,
          escalationFees: totalEscalationFees,
          travelExpenses: totalTravelExpenses,
          totalAmount,
          status,
          lineItems: lineItemsData.length > 0 ? {
            create: lineItemsData.map((item) => ({
              siteId: item.siteId,
              machineCount: item.machineCount,
              subscriptionFee: item.subscriptionFee,
              usageHours: item.usageHours,
              usageFee: item.usageFee,
              escalationFees: item.escalationFees,
              travelExpenses: item.travelExpenses,
              subtotal: item.subtotal,
            })),
          } : undefined,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              pricingTier: true,
            },
          },
          lineItems: {
            include: {
              site: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                  state: true,
                },
              },
            },
          },
        },
      });

      // Link tickets to this invoice
      if (tickets.length > 0) {
        await tx.ticket.updateMany({
          where: {
            id: {
              in: tickets.map((t) => t.id),
            },
          },
          data: {
            invoiceId: newInvoice.id,
          },
        });
      }

      return newInvoice;
    });

    // Convert Decimal types to numbers
    const serializedInvoice = {
      ...invoice,
      subscriptionFee: Number(invoice.subscriptionFee),
      usageHours: Number(invoice.usageHours),
      usageFee: Number(invoice.usageFee),
      escalationFees: Number(invoice.escalationFees),
      travelExpenses: Number(invoice.travelExpenses),
      totalAmount: Number(invoice.totalAmount),
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        subscriptionFee: Number(item.subscriptionFee),
        usageHours: Number(item.usageHours),
        usageFee: Number(item.usageFee),
        escalationFees: Number(item.escalationFees),
        travelExpenses: Number(item.travelExpenses),
        subtotal: Number(item.subtotal),
      })),
    };

    return NextResponse.json(serializedInvoice, { status: 201 });
  } catch (error: any) {
    console.error("Error creating invoice:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to create invoice", 
        details: error?.message || "Unknown error occurred",
        // Include more details in development
        ...(process.env.NODE_ENV === "development" && {
          stack: error?.stack,
          code: error?.code,
        }),
      },
      { status: 500 }
    );
  }
}

