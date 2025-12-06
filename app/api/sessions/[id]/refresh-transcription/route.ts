import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTwilioClient } from "@/lib/twilio";

/**
 * Refresh Transcription API
 * 
 * POST: Manually check Twilio for transcription and update the session
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get the session with recording SID and communication request info
    const session = await prisma.session.findUnique({
      where: { id },
      select: {
        id: true,
        callRecordingSid: true,
        callRecordingUrl: true,
        callTranscription: true,
        callTranscriptionSid: true,
        startTime: true,
        endTime: true,
        communicationRequest: {
          select: {
            id: true,
            customerPhone: true,
            completedAt: true,
          },
        },
      },
    });
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    
    // If no recording SID, check if recording exists in Twilio
    let recordingSid = session.callRecordingSid;
    let recordingUrl = session.callRecordingUrl;
    
    console.log(`[Refresh Transcription] Session ${id} - Recording SID: ${recordingSid || 'NOT FOUND'}`);
    
    if (!recordingSid) {
      // Try to find the recording in Twilio by checking recent recordings
      // This can happen if the webhook hasn't fired yet
      const twilioClient = getTwilioClient();
      
      try {
        // Get recordings from the last 2 hours (more generous window)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const recordings = await twilioClient.recordings.list({
          dateCreatedAfter: twoHoursAgo,
          limit: 50, // Check more recordings
        });
        
        console.log(`[Refresh Transcription] Found ${recordings.length} recent recordings in Twilio`);
        
        // Try to match by time (within 10 minutes to account for delays)
        const callTime = session.startTime;
        const callEndTime = session.endTime || new Date();
        
        for (const recording of recordings) {
          const recordingTime = new Date(recording.dateCreated);
          const timeDiff = Math.abs(recordingTime.getTime() - callTime.getTime());
          const endTimeDiff = session.endTime ? Math.abs(recordingTime.getTime() - callEndTime.getTime()) : Infinity;
          
          // Match if recording was created within 10 minutes of call start or end
          if (timeDiff < 10 * 60 * 1000 || endTimeDiff < 10 * 60 * 1000) {
            // This might be our recording - update the session
            recordingSid = recording.sid;
            recordingUrl = recording.uri.replace('.json', '.mp3'); // Convert JSON URI to MP3
            
            await prisma.session.update({
              where: { id },
              data: {
                callRecordingSid: recording.sid,
                callRecordingUrl: recordingUrl,
              },
            });
            
            console.log(`[Refresh Transcription] Found matching recording: ${recordingSid} (time diff: ${Math.round(timeDiff / 1000)}s)`);
            break;
          }
        }
        
        if (!recordingSid) {
          console.warn(`[Refresh Transcription] No matching recording found. Call time: ${callTime.toISOString()}, Checked ${recordings.length} recordings`);
          
          // Log all recordings for debugging
          console.log(`[Refresh Transcription] Recent recordings:`, recordings.map(r => ({
            sid: r.sid,
            dateCreated: r.dateCreated,
            duration: r.duration,
          })));
          
          return NextResponse.json({
            success: false,
            message: `Recording not found. Checked ${recordings.length} recent recordings. The recording may still be processing (usually takes 1-2 minutes after call ends). Please wait a few minutes and try again.`,
            debug: {
              callStartTime: callTime.toISOString(),
              callEndTime: callEndTime.toISOString(),
              recordingsChecked: recordings.length,
              recentRecordings: recordings.slice(0, 5).map(r => ({
                sid: r.sid,
                dateCreated: r.dateCreated,
                duration: r.duration,
              })),
            },
          });
        }
      } catch (error: any) {
        console.error("[Refresh Transcription] Error finding recording:", error);
        return NextResponse.json({
          success: false,
          message: `Error checking for recording: ${error.message}`,
          error: error.message,
        });
      }
    }
    
    // If transcription already exists, return it
    if (session.callTranscription) {
      return NextResponse.json({
        success: true,
        transcription: session.callTranscription,
        message: "Transcription already available",
      });
    }
    
    // Check Twilio for transcription
    const twilioClient = getTwilioClient();
    let transcriptionText = null;
    let transcriptionSid = null;
    
    try {
      // First, verify the recording exists
      try {
        const recording = await twilioClient.recordings(recordingSid).fetch();
        console.log(`[Refresh Transcription] Recording verified: ${recordingSid}, duration: ${recording.duration}s`);
      } catch (error: any) {
        console.error(`[Refresh Transcription] Recording ${recordingSid} not found:`, error.message);
        return NextResponse.json({
          success: false,
          message: `Recording not found in Twilio. The recording may still be processing. Please wait a few minutes and try again.`,
          recordingSid: recordingSid,
        });
      }
      
      // List transcriptions for this recording
      // Note: Twilio API doesn't support filtering by recordingSid directly in list()
      // so we fetch recent transcriptions and filter by recordingSid
      const allTranscriptions = await twilioClient.transcriptions.list({
        limit: 50,
      });
      const transcriptions = allTranscriptions.filter(t =>
        t.recordingSid === recordingSid
      );
      
      console.log(`[Refresh Transcription] Checking ${transcriptions.length} transcriptions for recording ${recordingSid}`);
      
      // Log all transcription statuses for debugging
      transcriptions.forEach((t, i) => {
        console.log(`[Refresh Transcription] Transcription ${i + 1}: ${t.sid} - Status: ${t.status}`);
      });
      
      // Find the first completed transcription
      for (const transcription of transcriptions) {
        if (transcription.status === "completed") {
          transcriptionSid = transcription.sid;
          
          // Fetch the full transcription text
          const transcriptionData = await twilioClient.transcriptions(transcriptionSid).fetch();
          transcriptionText = transcriptionData.transcriptionText || null;
          
          console.log(`[Refresh Transcription] Found completed transcription: ${transcriptionSid}, length: ${transcriptionText?.length || 0} chars`);
          break;
        }
      }
      
      // If no completed transcription found, check if one is in progress
      if (!transcriptionText && transcriptions.length > 0) {
        // Cast status to string to handle all possible Twilio statuses
        const inProgress = transcriptions.find(t => (t.status as string) === "in-progress" || (t.status as string) === "queued");
        const failed = transcriptions.find(t => t.status === "failed");
        
        if (failed) {
          console.warn(`[Refresh Transcription] Transcription failed: ${failed.sid}`);
          // Try to create a new one if the previous one failed
        } else if (inProgress) {
          console.log(`[Refresh Transcription] Transcription in progress: ${inProgress.sid} - Status: ${inProgress.status}`);
          return NextResponse.json({
            success: false,
            message: `Transcription is still being processed (status: ${inProgress.status})`,
            status: inProgress.status,
            transcriptionSid: inProgress.sid,
          });
        }
      }
      
      // If still no transcription, we can't create one via API
      // Note: Transcription is NOT available for Dial recordings
      // Transcription only works with the <Record> verb, not with Dial's record attribute
      // This is a Twilio limitation - Dial recordings cannot be transcribed
      if (!transcriptionText) {
        console.warn(`[Refresh Transcription] No transcription available for recording ${recordingSid}. Dial recordings cannot be transcribed.`);
        return NextResponse.json({
          success: false,
          message: "Transcription is not available for this call. Twilio does not support transcription for calls recorded using the Dial verb. Transcription only works with the Record verb, which requires a different call flow.",
          recordingSid: recordingSid,
          note: "This is a Twilio limitation. To enable transcription, the call flow would need to use the Record verb instead of Dial's record attribute.",
        });
      }
      
      // Update the session with transcription if found
      if (transcriptionText) {
        await prisma.session.update({
          where: { id },
          data: {
            callTranscription: transcriptionText,
            callTranscriptionSid: transcriptionSid,
          },
        });
        
        console.log(`[Refresh Transcription] Updated session ${id} with transcription`);
        
        return NextResponse.json({
          success: true,
          transcription: transcriptionText,
          message: "Transcription updated successfully",
        });
      } else {
        // This shouldn't happen, but just in case
        console.warn(`[Refresh Transcription] No transcription found but also didn't create one. Recording: ${recordingSid}`);
        return NextResponse.json({
          success: false,
          message: "Transcription not yet available. A new transcription request may have been created. Please try again in 3-5 minutes.",
          recordingSid: recordingSid,
        });
      }
      
    } catch (error: any) {
      console.error("[Refresh Transcription] Error checking Twilio:", error);
      return NextResponse.json(
        { 
          error: "Failed to check transcription",
          details: error.message 
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error refreshing transcription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to refresh transcription" },
      { status: 500 }
    );
  }
}

