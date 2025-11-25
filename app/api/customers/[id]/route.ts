import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Single Customer API Route
 * 
 * GET: Fetch a single customer with their sites
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.company.findUnique({
      where: {
        id: params.id,
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
            machines: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}


