import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";
import { signIn } from "next-auth/react";

/**
 * Custom Login API Route
 * 
 * This bypasses NextAuth's client-side issues by handling login
 * directly on the server.
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
        console.log(`⚠️  Found user with different case: ${user.email} (searched for: ${normalizedEmail})`);
        // Update the email to lowercase for consistency
        await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail },
        });
        console.log(`✅ Updated user email to lowercase: ${normalizedEmail}`);
      }
    }

    if (!user) {
      console.error(`Login failed: User not found for email: ${email.trim()} (normalized: ${normalizedEmail})`);
      // List all user emails for debugging (in development only)
      if (process.env.NODE_ENV === "development") {
        const allUsers = await prisma.user.findMany({
          select: { email: true },
          take: 10,
        });
        console.log(`Available user emails (first 10):`, allUsers.map(u => u.email));
      }
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      console.error(`Login failed: User ${user.email} is inactive`);
      return NextResponse.json(
        { error: "Your account has been deactivated. Please contact support." },
        { status: 403 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      console.error(`Login failed: Invalid password for user: ${user.email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create a simple session token (we'll use JWT)
    // For now, return success and we'll handle session in the client
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
  } catch (error: any) {
    console.error("Login API error:", error);
    console.error("Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Provide more specific error messages
    let errorMessage = "Something went wrong";
    if (error?.message?.includes("Can't reach database")) {
      errorMessage = "Database connection failed. Please check your connection settings.";
    } else if (error?.message) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}


