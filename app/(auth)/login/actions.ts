"use server";

import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

/**
 * Server Action for Login
 * 
 * This runs on the server and handles authentication directly.
 * This bypasses the client-side NextAuth issues.
 */

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return { error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    // Create session manually using NextAuth
    // We'll use a different approach - create a session token
    const { signIn: serverSignIn } = await import("next-auth/react");
    
    // Actually, let's use a simpler approach - just redirect after setting a cookie
    // For now, let's return success and handle the session in the page
    
    return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "Something went wrong" };
  }
}


