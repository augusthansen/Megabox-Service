import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Twilio Call Status Webhook
 * 
 * POST: Handle call status updates from Twilio
 * This is called when a call status changes (ringing, in-progress, completed, etc.)
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const to = formData.get("To") as string;
    const from = formData.get("From") as string;
    
    console.log("[Twilio Call Status] Webhook received:", {
      callSid,
      callStatus,
      callDuration,
      to,
      from,
    });
    
    // When call is completed, update the session duration
    if (callStatus === "completed" && callDuration) {
      const durationMinutes = Math.ceil(parseInt(callDuration) / 60);
      
      // Find the most recent phone call session without an end time
      const session = await prisma.session.findFirst({
        where: {
          sessionType: "phone_call",
          endTime: null,
        },
        orderBy: {
          startTime: "desc",
        },
      });
      
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            endTime: new Date(),
            durationMinutes: durationMinutes,
          },
        });
        
        console.log("[Twilio Call Status] Updated session duration:", session.id, durationMinutes, "minutes");
      }
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[Twilio Call Status] Error processing call status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process call status" },
      { status: 500 }
    );
  }
}

