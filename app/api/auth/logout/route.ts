import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/jwt";

/**
 * Logout
 *
 * Clears the session cookie and redirects to login.
 */
export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await clearSessionCookie();
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }
}
