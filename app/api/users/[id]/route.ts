import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { createContactInHubspot } from "@/lib/hubspot";

/**
 * Individual User API Routes
 * Handles get, update, and delete for a single user
 */

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        phone: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

// PATCH - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, email, password, role, companyId, isActive, phone } = body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) {
      // Normalize email to lowercase
      const normalizedEmail = email.trim().toLowerCase();
      
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          NOT: { id: params.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 400 }
        );
      }

      updateData.email = normalizedEmail;
    }
    if (password !== undefined && password !== "") {
      updateData.passwordHash = await hashPassword(password);
    }
    if (role !== undefined) updateData.role = role;
    if (companyId !== undefined) updateData.companyId = companyId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (phone !== undefined) updateData.phone = phone || null;

    // Get current user to check if they're a service tech and have HubSpot ID
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, hubspotId: true, email: true, name: true },
    });

    // If user is being updated to service_tech and doesn't have HubSpot ID, create contact
    const isServiceTech = role === "service_tech" || currentUser?.role === "service_tech";
    const needsHubspotSync = isServiceTech && !currentUser?.hubspotId;

    if (needsHubspotSync) {
      try {
        const nameToUse = name || currentUser?.name || "";
        const emailToUse = updateData.email || currentUser?.email || "";
        
        if (emailToUse && nameToUse) {
          // Split name into first and last name
          const nameParts = nameToUse.trim().split(" ");
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Create contact in HubSpot
          const hubspotContact = await createContactInHubspot({
            email: emailToUse,
            firstName,
            lastName,
            phone: phone || undefined,
          });

          if (hubspotContact && hubspotContact.id) {
            updateData.hubspotId = hubspotContact.id;
            console.log(`Created HubSpot contact for service tech: ${emailToUse} (${hubspotContact.id})`);
          }
        }
      } catch (hubspotError: any) {
        // Log error but don't fail user update
        console.error("Error creating HubSpot contact for service tech:", hubspotError);
        console.error("User will be updated without HubSpot sync. Error:", hubspotError?.message);
        // Continue with user update even if HubSpot sync fails
      }
    }

    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        phone: true,
        hubspotId: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - Delete user (soft delete by deactivating)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Instead of deleting, we deactivate the user
    const user = await prisma.user.update({
      where: {
        id: params.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

