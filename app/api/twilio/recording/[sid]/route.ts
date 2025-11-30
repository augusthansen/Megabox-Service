import { NextRequest, NextResponse } from "next/server";
import { getTwilioClient } from "@/lib/twilio";

/**
 * Twilio Recording Proxy
 * 
 * GET: Proxy Twilio recording audio files with authentication
 * This allows the audio player to access recordings without requiring
 * users to authenticate with Twilio directly
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sid: string }> }
) {
  try {
    const { sid } = await params;
    
    if (!sid) {
      return NextResponse.json(
        { error: "Recording SID is required" },
        { status: 400 }
      );
    }
    
    // Get Twilio client
    const twilioClient = getTwilioClient();
    
    // Fetch the recording from Twilio
    const recording = await twilioClient.recordings(sid).fetch();
    
    // Get the MP3 URL - Twilio provides authenticated URLs
    // We need to fetch the actual audio file and stream it
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }
    
    // Construct the authenticated URL
    const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${sid}.mp3`;
    
    // Fetch the audio file with authentication
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const audioResponse = await fetch(recordingUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
      },
    });
    
    if (!audioResponse.ok) {
      console.error("[Twilio Recording Proxy] Failed to fetch recording:", audioResponse.status, audioResponse.statusText);
      return NextResponse.json(
        { error: "Failed to fetch recording from Twilio" },
        { status: audioResponse.status }
      );
    }
    
    // Get the audio data
    const audioBuffer = await audioResponse.arrayBuffer();
    
    // Return the audio with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Accept-Ranges': 'bytes', // Support range requests for seeking
      },
    });
  } catch (error: any) {
    console.error("[Twilio Recording Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to proxy recording", details: error.message },
      { status: 500 }
    );
  }
}

