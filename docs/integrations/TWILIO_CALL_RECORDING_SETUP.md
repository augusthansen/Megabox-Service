# Twilio Call Recording & Transcription Setup

## Overview

The app now supports automatic call recording and transcription for phone calls made through the Twilio integration. This allows you to:

- **Record all phone calls** automatically
- **Transcribe call recordings** to text
- **View call details** including duration, cost, recording, and transcription
- **Track call resolution status** (resolved, ongoing, needs follow-up)

## Features

### Call Details Display

For each completed phone call, you'll see:

1. **Duration**: Total call length in minutes
2. **Cost**: Total cost of the call
3. **Recording**: Link to listen to the call recording
4. **Transcription**: Full text transcription of the call (when available)
5. **Resolution Status**: Dropdown to mark if the call resolved the issue, is ongoing, or needs follow-up

### How It Works

1. **When a call is made**: Twilio automatically starts recording when the call is answered
2. **When the call ends**: Twilio sends a webhook to update the call status and duration
3. **When recording is ready**: Twilio sends a webhook with the recording URL
4. **Transcription**: Automatically requested when the recording is available

## Setup Instructions

### 1. Update TwiML App (Required)

You need to add a **Call Status Callback URL** to your TwiML App in Twilio Console:

1. Go to [Twilio Console](https://console.twilio.com/) → **Runtime** → **TwiML** → **TwiML Apps**
2. Click on your TwiML App (the one with SID: `AP1987d02cfaa5dc20a4419afe3d3f053a`)
3. Under **Voice Configuration**, find **Status Callback URL**
4. Add your ngrok URL (or production URL):
   ```
   https://your-ngrok-url.ngrok-free.dev/api/twilio/call-status
   ```
5. Set **Status Callback Method** to **POST**
6. Click **Save**

### 2. Recording Status Callback (Already Configured)

The recording status callback is automatically configured in the TwiML generation code. It uses:
```
https://your-ngrok-url.ngrok-free.dev/api/twilio/recording-status
```

**Note**: Make sure your `NEXTAUTH_URL` environment variable is set to your ngrok URL (or production URL) so the callbacks work correctly.

### 3. Update Environment Variables

Make sure your `.env.local` includes:

```env
NEXTAUTH_URL=https://your-ngrok-url.ngrok-free.dev
# or for production:
# NEXTAUTH_URL=https://your-production-domain.com
```

## Using the Feature

### For Service Techs

1. **Make a phone call** through the app (via Communication Request)
2. **Complete the call** by clicking "End Call"
3. **View call details** in the Communication Request section
4. **Listen to recording** by clicking "Listen to Recording"
5. **Read transcription** (appears automatically when available)
6. **Set resolution status** using the dropdown:
   - **Resolved**: Issue was fixed during the call
   - **Ongoing**: Issue is still being worked on
   - **Needs Follow-up**: Requires additional action

### For Admins

- View all call details in the ticket detail page
- See call recordings and transcriptions for billing/quality purposes
- Track resolution status across all calls

## Troubleshooting

### Recording Not Appearing

1. **Check ngrok is running**: Make sure ngrok is active and the URL matches your TwiML App
2. **Check webhook logs**: Look in your server terminal for `[Twilio Recording]` logs
3. **Verify TwiML App**: Ensure the recording callback URL is set correctly
4. **Check Twilio Console**: Go to **Monitor** → **Logs** → **Recordings** to see if recordings are being created

### Transcription Not Available

**Processing Times:**
- **Recording**: Usually available within **1-2 minutes** after call ends
- **Transcription**: Typically available within **3-5 minutes** after recording is ready (so **4-7 minutes total** after call ends)
- Longer calls may take longer to transcribe
- The app automatically requests transcription when the recording is ready

**If transcription doesn't appear:**
- Wait up to 10 minutes for longer calls
- Check Twilio Console → **Monitor** → **Logs** → **Transcriptions** to see processing status
- Verify the recording was created successfully first
- Check server logs for `[Twilio Recording]` messages

### Call Duration Not Updating

- Make sure the **Call Status Callback URL** is set in your TwiML App
- Check server logs for `[Twilio Call Status]` messages
- Verify the callback URL is accessible (test with the GET endpoint)

## API Endpoints

- `POST /api/twilio/recording-status` - Receives recording status updates from Twilio
- `POST /api/twilio/call-status` - Receives call status updates from Twilio
- `PATCH /api/sessions/[id]` - Update session details (resolution status, notes)

## Database Schema

The `Session` model now includes:
- `callRecordingUrl` - URL to the Twilio recording
- `callRecordingSid` - Twilio recording SID
- `callTranscription` - Full transcription text
- `callTranscriptionSid` - Twilio transcription SID
- `callResolutionStatus` - Status: "resolved", "ongoing", or "needs_followup"

