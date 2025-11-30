import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTwilioClient } from "@/lib/twilio";

/**
 * Twilio Recording Status Webhook
 * 
 * POST: Handle recording status updates from Twilio
 * This is called when a recording is completed and ready
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Test endpoint to verify webhook is accessible
  return NextResponse.json({
    status: "ok",
    message: "Twilio recording webhook is accessible",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const recordingSid = formData.get("RecordingSid") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const callSid = formData.get("CallSid") as string;
    const recordingStatus = formData.get("RecordingStatus") as string;
    const recordingDuration = formData.get("RecordingDuration") as string;
    
    console.log("[Twilio Recording] Webhook received:", {
      recordingSid,
      recordingUrl,
      callSid,
      recordingStatus,
      recordingDuration,
    });
    
    if (recordingStatus === "completed" && recordingSid && callSid) {
      // Find the session by matching the call SID
      // We'll need to store the call SID when the call starts
      // For now, try to find by communication request or recent phone call sessions
      
      // Get the recording details from Twilio
      const twilioClient = getTwilioClient();
      const recording = await twilioClient.recordings(recordingSid).fetch();
      
      // Get the transcription if available
      let transcriptionText = null;
      let transcriptionSid = null;
      
      try {
        const transcriptions = await twilioClient.transcriptions.list({
          recordingSid: recordingSid,
          limit: 1,
        });
        
        if (transcriptions.length > 0) {
          const transcription = transcriptions[0];
          transcriptionSid = transcription.sid;
          
          // Fetch the full transcription
          const transcriptionData = await twilioClient.transcriptions(transcriptionSid).fetch();
          transcriptionText = transcriptionData.transcriptionText || null;
        } else {
          // Note: Transcription is NOT available for Dial recordings
          // Transcription only works with the <Record> verb, not with Dial's record attribute
          // We'll skip transcription for Dial recordings
          console.log("[Twilio Recording] No transcription available for Dial recordings. Transcription only works with <Record> verb.");
        }
      } catch (error) {
        console.error("[Twilio Recording] Error fetching transcription:", error);
      }
      
      // Find session by matching call details
      // Try to find a session that matches the call time and phone number
      // We'll match by finding the most recent phone call session without a recording
      // that ended within the last hour (to account for recording processing time)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const session = await prisma.session.findFirst({
        where: {
          sessionType: "phone_call",
          callRecordingSid: null,
          endTime: {
            not: null,
            gte: oneHourAgo, // Only check recent sessions
          },
        },
        orderBy: {
          endTime: "desc",
        },
        include: {
          communicationRequest: {
            select: {
              customerPhone: true,
            },
          },
        },
      });
      
      if (session) {
        // Ensure recording URL is in MP3 format for audio playback
        // Twilio provides .json URLs, but we need .mp3 for audio players
        let mp3RecordingUrl = recordingUrl;
        if (recordingUrl && recordingUrl.endsWith('.json')) {
          mp3RecordingUrl = recordingUrl.replace('.json', '.mp3');
        } else if (recordingUrl && !recordingUrl.includes('.mp3') && !recordingUrl.includes('.wav')) {
          // If URL doesn't have extension, try to construct MP3 URL from SID
          const accountSid = process.env.TWILIO_ACCOUNT_SID;
          if (accountSid && recordingSid) {
            mp3RecordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}.mp3`;
          }
        }
        
        // Update session with recording details
        await prisma.session.update({
          where: { id: session.id },
          data: {
            callRecordingUrl: mp3RecordingUrl,
            callRecordingSid: recordingSid,
            callTranscription: transcriptionText,
            callTranscriptionSid: transcriptionSid,
          },
        });
        
        console.log("[Twilio Recording] Updated session with recording:", session.id);
      } else {
        console.warn("[Twilio Recording] No matching session found for call SID:", callSid);
      }
    }
    
    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("[Twilio Recording] Error processing recording status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process recording status" },
      { status: 500 }
    );
  }
}

