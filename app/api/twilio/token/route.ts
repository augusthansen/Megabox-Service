import { NextRequest, NextResponse } from "next/server";
import { generateTwilioToken } from "@/lib/twilio";

/**
 * Twilio Token API Route
 * 
 * GET: Generate a Twilio access token for client-side calling
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const identity = searchParams.get("identity");
    
    console.log(`[Twilio Token API] Received identity request: "${identity}"`);
    
    if (!identity) {
      return NextResponse.json(
        { error: "Identity parameter is required" },
        { status: 400 }
      );
    }
    
    // Generate Twilio token (this will sanitize the identity internally)
    const token = generateTwilioToken(identity);
    
    console.log(`[Twilio Token API] Token generated successfully for identity: "${identity}"`);
    
    return NextResponse.json({
      token,
      identity, // Return the sanitized identity from the token
    });
  } catch (error: any) {
    console.error("Error generating Twilio token:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate Twilio token",
        details: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

