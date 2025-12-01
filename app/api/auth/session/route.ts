import { NextResponse } from "next/server";
import { getSession } from "@/lib/jwt";

/**
 * Get Current Session
 *
 * Returns the current user's session data from the JWT cookie.
 */
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role,
        companyId: session.companyId,
      },
    });
  } catch (error) {
    console.error("Session error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
