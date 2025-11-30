import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createContactInHubspot } from "@/lib/hubspot";

/**
 * Users API Routes
 * Handles user listing and creation
 */

// GET - List all users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    console.log("Users API: Fetching users with companyId:", companyId);

    const where = companyId ? { companyId } : {};

    console.log("Users API: Prisma where clause:", where);

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        hubspotId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Users API: Found users:", users.length);
    console.log("Users API: Users data:", users.map(u => ({ id: u.id, name: u.name, email: u.email, companyId: u.companyId })));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Error fetching users:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { error: "Failed to fetch users", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role, companyId } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "Name, email, password, and role are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Normalize email to lowercase
    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["super_admin", "service_tech", "customer_admin", "customer_tech"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Customer roles require a company
    if ((role === "customer_admin" || role === "customer_tech") && !companyId) {
      return NextResponse.json(
        { error: "Company is required for customer roles" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // For service tech users, create/link HubSpot contact
    let hubspotId: string | null = null;
    if (role === "service_tech") {
      try {
        // Split name into first and last name
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create contact in HubSpot
        const hubspotContact = await createContactInHubspot({
          email: normalizedEmail,
          firstName,
          lastName,
        });

        if (hubspotContact && hubspotContact.id) {
          hubspotId = hubspotContact.id;
          console.log(`Created HubSpot contact for service tech: ${normalizedEmail} (${hubspotId})`);
        }
      } catch (hubspotError: any) {
        // Log error but don't fail user creation
        console.error("Error creating HubSpot contact for service tech:", hubspotError);
        console.error("User will be created without HubSpot sync. Error:", hubspotError?.message);
        // Continue with user creation even if HubSpot sync fails
      }
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail, // Store email in lowercase
        passwordHash: hashedPassword,
        role,
        companyId: companyId || null,
        isActive: true,
        hubspotId: hubspotId, // Store HubSpot contact ID if created
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        hubspotId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

