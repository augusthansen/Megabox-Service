import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Twilio Transcription Status Webhook
 * 
 * POST: Handle transcription status updates from Twilio
 * This is called when a transcription is completed
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Test endpoint to verify webhook is accessible
  return NextResponse.json({
    status: "ok",
    message: "Twilio transcription webhook is accessible",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    // Log all form data for debugging
    const formData = await request.formData();
    const allParams = Object.fromEntries(formData.entries());
    
    console.log("[Twilio Transcription] ========== WEBHOOK CALLED ==========");
    console.log("[Twilio Transcription] All parameters received:", allParams);
    
    const transcriptionSid = formData.get("TranscriptionSid") as string;
    const transcriptionText = formData.get("TranscriptionText") as string;
    const recordingSid = formData.get("RecordingSid") as string;
    const callSid = formData.get("CallSid") as string;
    const transcriptionStatus = formData.get("TranscriptionStatus") as string;
    
    console.log("[Twilio Transcription] Webhook received:", {
      transcriptionSid,
      transcriptionText: transcriptionText ? `${transcriptionText.substring(0, 50)}...` : null,
      transcriptionTextLength: transcriptionText?.length || 0,
      recordingSid,
      callSid,
      transcriptionStatus,
    });
    
    if (transcriptionStatus === "completed" && transcriptionSid && recordingSid && transcriptionText) {
      // Find the session by recording SID
      const session = await prisma.session.findFirst({
        where: {
          callRecordingSid: recordingSid,
        },
      });
      
      if (session) {
        await prisma.session.update({
          where: { id: session.id },
          data: {
            callTranscription: transcriptionText,
            callTranscriptionSid: transcriptionSid,
          },
        });
        
        console.log("[Twilio Transcription] Updated session with transcription:", session.id);
      } else {
        console.warn("[Twilio Transcription] No matching session found for recording SID:", recordingSid);
      }
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[Twilio Transcription] Error processing transcription status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process transcription status" },
      { status: 500 }
    );
  }
}

