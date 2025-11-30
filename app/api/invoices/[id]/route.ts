import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Individual Invoice API Routes
 * Handles get, update, and delete for a single invoice
 */

// GET - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            pricingTier: true,
            pricePerMachine: true,
            hourlyRate: true,
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
                zipCode: true,
              },
            },
          },
          orderBy: {
            site: {
              name: "asc",
            },
          },
        },
        tickets: {
          select: {
            id: true,
            ticketNumber: true,
            subject: true,
            site: {
              select: {
                id: true,
                name: true,
              },
            },
            totalMinutes: true,
            totalCost: true,
            escalationFees: true,
            travelExpenses: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Convert Decimal types to numbers
    const serializedInvoice = {
      ...invoice,
      subscriptionFee: Number(invoice.subscriptionFee),
      usageHours: Number(invoice.usageHours),
      usageFee: Number(invoice.usageFee),
      escalationFees: Number(invoice.escalationFees),
      travelExpenses: Number(invoice.travelExpenses),
      totalAmount: Number(invoice.totalAmount),
      company: {
        ...invoice.company,
        pricePerMachine: Number(invoice.company.pricePerMachine),
        hourlyRate: Number(invoice.company.hourlyRate),
      },
      lineItems: invoice.lineItems.map((item) => ({
        ...item,
        subscriptionFee: Number(item.subscriptionFee),
        usageHours: Number(item.usageHours),
        usageFee: Number(item.usageFee),
        escalationFees: Number(item.escalationFees),
        travelExpenses: Number(item.travelExpenses),
        subtotal: Number(item.subtotal),
      })),
      tickets: invoice.tickets.map((ticket) => ({
        ...ticket,
        totalCost: Number(ticket.totalCost),
        escalationFees: Number(ticket.escalationFees),
        travelExpenses: Number(ticket.travelExpenses),
      })),
    };

    return NextResponse.json(serializedInvoice);
  } catch (error: any) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice", details: error?.message },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      billingPeriod,
      machineCount,
      subscriptionFee,
      usageHours,
      usageFee,
      escalationFees,
      travelExpenses,
      status,
      paidDate,
      quickbooksInvoiceId,
    } = body;

    // Get existing invoice to access company info
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            pricePerMachine: true,
            hourlyRate: true,
          },
        },
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (billingPeriod !== undefined) updateData.billingPeriod = billingPeriod;
    if (machineCount !== undefined) updateData.machineCount = machineCount;
    if (subscriptionFee !== undefined)
      updateData.subscriptionFee = new Decimal(subscriptionFee);
    if (usageHours !== undefined)
      updateData.usageHours = new Decimal(usageHours);
    if (usageFee !== undefined) updateData.usageFee = new Decimal(usageFee);
    if (escalationFees !== undefined)
      updateData.escalationFees = new Decimal(escalationFees);
    if (travelExpenses !== undefined)
      updateData.travelExpenses = new Decimal(travelExpenses);
    if (status !== undefined) updateData.status = status;
    if (paidDate !== undefined)
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    if (quickbooksInvoiceId !== undefined)
      updateData.quickbooksInvoiceId = quickbooksInvoiceId;

    // Recalculate total if any amount fields changed
    if (
      subscriptionFee !== undefined ||
      usageFee !== undefined ||
      escalationFees !== undefined ||
      travelExpenses !== undefined
    ) {
      const subFee = updateData.subscriptionFee || existingInvoice.subscriptionFee;
      const useFee = updateData.usageFee || existingInvoice.usageFee;
      const escFees = updateData.escalationFees || existingInvoice.escalationFees;
      const travel = updateData.travelExpenses || existingInvoice.travelExpenses;

      updateData.totalAmount = subFee
        .plus(useFee)
        .plus(escFees)
        .plus(travel);
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            pricingTier: true,
            pricePerMachine: true,
            hourlyRate: true,
          },
        },
      },
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
      company: {
        ...invoice.company,
        pricePerMachine: Number(invoice.company.pricePerMachine),
        hourlyRate: Number(invoice.company.hourlyRate),
      },
    };

    return NextResponse.json(serializedInvoice);
  } catch (error: any) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice", details: error?.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Failed to delete invoice", details: error?.message },
      { status: 500 }
    );
  }
}

