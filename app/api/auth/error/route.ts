import { NextResponse } from "next/server";

/**
 * NextAuth Error Handler
 * 
 * This handles GET requests to /api/auth/error
 * NextAuth tries to redirect here on errors, but we'll just return a JSON response
 */

export async function GET(request: Request) {
  // Get error from query params
  const { searchParams } = new URL(request.url);
  const error = searchParams.get("error");

  // Return JSON with 200 status - NextAuth expects this
  return NextResponse.json(
    { error: error || "Authentication error" },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  // Also handle POST requests
  return NextResponse.json(
    { error: "Authentication error" },
    { status: 200 }
  );
}

