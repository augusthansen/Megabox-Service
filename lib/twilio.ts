import twilio from "twilio";

/**
 * Twilio Integration Utilities
 * 
 * Handles Twilio voice calling functionality
 */

let twilioClient: twilio.Twilio | null = null;

/**
 * Get Twilio client instance
 */
export function getTwilioClient(): twilio.Twilio {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error("TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in environment variables");
    }
    
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

/**
 * Sanitize identity for Twilio (alphanumeric, underscores, hyphens only)
 * Twilio identities must not contain spaces or special characters
 */
function sanitizeTwilioIdentity(identity: string): string {
  // Replace spaces and special characters with underscores
  // Keep only alphanumeric, underscores, and hyphens
  return identity
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 50); // Limit length to 50 characters
}

/**
 * Generate a Twilio access token for client-side calling
 */
export function generateTwilioToken(identity: string): string {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  
  if (!accountSid || !apiKey || !apiSecret) {
    throw new Error("TWILIO_ACCOUNT_SID, TWILIO_API_KEY, and TWILIO_API_SECRET must be set");
  }
  
  // Sanitize identity to ensure it's valid for Twilio
  const sanitizedIdentity = sanitizeTwilioIdentity(identity);
  
  // Log for debugging (remove in production)
  if (identity !== sanitizedIdentity) {
    console.log(`[Twilio] Sanitized identity: "${identity}" -> "${sanitizedIdentity}"`);
  }
  
  // Use Twilio's JWT library - need to import it separately
  const AccessToken = require("twilio").jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;
  
  // Create an access token
  const token = new AccessToken(accountSid, apiKey, apiSecret, {
    identity: sanitizedIdentity,
  });
  
  // Grant the token permission to make outbound calls
  const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;
  
  if (!twimlAppSid) {
    throw new Error("TWILIO_TWIML_APP_SID must be set");
  }
  
  console.log(`[Twilio Token] Using TwiML App SID: ${twimlAppSid}`);
  
  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: false, // Set to true if you want to receive incoming calls
  });
  
  token.addGrant(voiceGrant);
  
  const jwt = token.toJwt();
  console.log(`[Twilio Token] Token generated successfully for identity: ${sanitizedIdentity}`);
  
  return jwt;
}

/**
 * Create a TwiML application for outbound calls
 * This should be set up once in your Twilio console
 */
export async function createTwiMLApp(friendlyName: string) {
  const client = getTwilioClient();
  
  // This is typically done once in Twilio console, but we can create it programmatically
  const app = await client.applications.create({
    friendlyName,
    voiceUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/twilio/voice`,
    voiceMethod: 'POST',
  });
  
  return app;
}

/**
 * Generate TwiML for outbound call
 */
export function generateOutboundTwiML(to: string, callerId?: string): string {
  console.log(`[Twilio TwiML] generateOutboundTwiML called with:`, { to, callerId });
  
  const twiml = new twilio.twiml.VoiceResponse();
  
  // Always use TWILIO_PHONE_NUMBER as caller ID
  // The callerId parameter (from webhook) is the client identity, not a phone number
  // We must use a Twilio phone number for the callerId attribute
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  console.log(`[Twilio TwiML] Using Twilio phone number as caller ID:`, fromNumber);
  console.log(`[Twilio TwiML] TWILIO_PHONE_NUMBER env var:`, fromNumber ? "SET" : "NOT SET");
  console.log(`[Twilio TwiML] Ignoring callerId parameter (client identity):`, callerId);
  
  if (!fromNumber) {
    console.error("[Twilio TwiML] ERROR: TWILIO_PHONE_NUMBER is not set in environment variables");
    throw new Error("TWILIO_PHONE_NUMBER must be set in environment variables");
  }
  
  // Ensure phone number is in E.164 format
  // Remove all whitespace first
  let formattedTo = to.trim().replace(/\s+/g, "");
  
  // Remove any non-digit characters except +
  if (!formattedTo.startsWith("+")) {
    // If it doesn't start with +, assume US number and add +1
    formattedTo = formattedTo.replace(/\D/g, ""); // Remove non-digits
    if (formattedTo.length === 10) {
      formattedTo = `+1${formattedTo}`;
    } else if (formattedTo.length === 11 && formattedTo.startsWith("1")) {
      formattedTo = `+${formattedTo}`;
    } else if (formattedTo.length > 0) {
      formattedTo = `+${formattedTo}`;
    } else {
      throw new Error(`Invalid phone number format: "${to}"`);
    }
  } else {
    // Already has +, just clean it up
    formattedTo = formattedTo.replace(/[^\d+]/g, ""); // Keep only digits and +
  }
  
  // Validate the phone number
  if (!formattedTo.match(/^\+\d{10,15}$/)) {
    throw new Error(`Invalid phone number format after formatting: "${formattedTo}" (original: "${to}")`);
  }
  
  console.log(`[Twilio TwiML] Dialing ${formattedTo} from ${fromNumber}`);
  
  // Get the base URL for webhooks
  // Must be publicly accessible (use ngrok URL for local development)
  const baseUrl = process.env.NEXTAUTH_URL || process.env.TWILIO_WEBHOOK_URL || 'http://localhost:3000';
  
  // Validate that the URL is HTTPS (required for production, or use ngrok for local)
  if (!baseUrl.startsWith('https://') && !baseUrl.includes('ngrok')) {
    console.warn(`[Twilio TwiML] Base URL is not HTTPS and doesn't appear to be ngrok: ${baseUrl}`);
    console.warn(`[Twilio TwiML] Twilio may not be able to reach this URL. Use ngrok for local development.`);
  }
  
  const recordingCallbackUrl = `${baseUrl}/api/twilio/recording-status`;
  console.log(`[Twilio TwiML] Using recording callback URL: ${recordingCallbackUrl}`);
  
  // Dial the number with caller ID
  // Note: callerId must be a verified Twilio phone number
  // Enable recording and transcription
  const transcriptionCallbackUrl = `${baseUrl}/api/twilio/transcription-status`;
  console.log(`[Twilio TwiML] Using transcription callback URL: ${transcriptionCallbackUrl}`);
  
  const dial = twiml.dial({
    callerId: fromNumber,
    timeout: 30, // Wait up to 30 seconds for answer
    record: "record-from-answer", // Record from when the call is answered
    recordingStatusCallback: recordingCallbackUrl,
    recordingStatusCallbackMethod: "POST",
    // Note: Dial verb doesn't support transcribe attribute
    // Transcription will be requested via API when recording is ready
    // Note: answerOnMedia is not a valid attribute for Dial verb
  }, formattedTo);
  
  // Transcription will be requested via API in the recording-status webhook
  
  const twimlString = twiml.toString();
  console.log(`[Twilio TwiML] Generated TwiML:`, twimlString);
  
  return twimlString;
}

