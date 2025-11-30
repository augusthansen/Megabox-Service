import { NextRequest, NextResponse } from "next/server";
import { generateOutboundTwiML } from "@/lib/twilio";

/**
 * Twilio Voice Webhook
 * 
 * GET: Test endpoint to verify webhook is accessible
 * POST: Handle Twilio voice webhooks and generate TwiML
 */

// Force dynamic rendering for webhooks
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Test endpoint to verify webhook is accessible and show sample TwiML
  const { generateOutboundTwiML } = await import("@/lib/twilio");
  const testTwiML = generateOutboundTwiML("+15551234567"); // Test number
  
  return NextResponse.json({
    status: "ok",
    message: "Twilio voice webhook is accessible",
    timestamp: new Date().toISOString(),
    sampleTwiML: testTwiML,
  });
}

export async function POST(request: NextRequest) {
  try {
    // Log that we received the request
    console.log("[Twilio Voice] ========== WEBHOOK CALLED ==========");
    console.log("[Twilio Voice] Request method:", request.method);
    console.log("[Twilio Voice] Request URL:", request.url);
    
    const formData = await request.formData();
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    
    // Log all form data
    const allParams = Object.fromEntries(formData.entries());
    console.log("[Twilio Voice] Webhook received:", { 
      to, 
      from, 
      callSid, 
      callStatus,
      allParams
    });
    
    // Validate required parameters
    if (!to) {
      console.error("[Twilio Voice] Missing 'To' parameter");
      console.error("[Twilio Voice] All params received:", allParams);
      throw new Error("Missing 'To' parameter in webhook request");
    }
    
    console.log("[Twilio Voice] Calling generateOutboundTwiML with:", { to, from });
    
    // Generate TwiML for the outbound call
    // The 'to' parameter is the destination phone number
    // The 'from' parameter is the client identity (e.g., "client:test"), not a phone number
    // We don't pass 'from' to generateOutboundTwiML because it will use TWILIO_PHONE_NUMBER as caller ID
    const twiml = generateOutboundTwiML(to);
    
    console.log("[Twilio Voice] Generated TwiML:", twiml);
    console.log("[Twilio Voice] Dialing:", to);
    
    return new NextResponse(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    });
  } catch (error: any) {
    console.error("[Twilio Voice] ========== ERROR ==========");
    console.error("[Twilio Voice] Error message:", error.message);
    console.error("[Twilio Voice] Error stack:", error.stack);
    console.error("[Twilio Voice] Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
    });
    console.error("[Twilio Voice] ============================");
    
    // Return error TwiML with more details
    const twilio = require("twilio");
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Log the specific error in the TwiML response (for debugging)
    const errorMessage = error.message || "Unknown error";
    console.error(`[Twilio Voice] Error: ${errorMessage}`);
    
    twiml.say({
      voice: "alice",
      language: "en-US"
    }, `Sorry, there was an error processing your call. Error: ${errorMessage}. Please try again later.`);
    twiml.hangup();
    
    const errorTwiml = twiml.toString();
    console.log("[Twilio Voice] Returning error TwiML:", errorTwiml);
    
    return new NextResponse(errorTwiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
      },
    });
  }
}

