import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

/**
 * Login API Route
 *
 * Handles user authentication via email and password.
 * Returns user data on success for client-side session management.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Normalize email for lookup
    const normalizedEmail = email.trim().toLowerCase();
    
    // Find user in database - try exact match first, then case-insensitive
    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If not found with lowercase, try case-insensitive search
    if (!user) {
      const users = await prisma.user.findMany({
        where: {
          email: {
            contains: normalizedEmail,
            mode: "insensitive",
          },
        },
      });
      if (users.length > 0) {
        user = users[0];
        // Update the email to lowercase for consistency
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail },
        });
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId, // Include companyId for customer users
      },
    });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}


