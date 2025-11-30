# 🔧 Fix: "Application Error" When Making Calls

## The Problem

When you click "Call Now" in the Twilio modal, you get: **"We are sorry an application error has occurred"**

This error means **Twilio cannot reach your TwiML App's Voice URL**.

## The Solution

### For Local Development (You Need ngrok)

Twilio needs to reach your local server, but `localhost` isn't accessible from the internet. You need **ngrok** to expose your local server.

#### Step 1: Install ngrok

```bash
# Option 1: Using Homebrew (Mac)
brew install ngrok

# Option 2: Download from https://ngrok.com/download
# Then unzip and add to your PATH
```

#### Step 2: Start ngrok

In a **new terminal window**, run:

```bash
# Replace 3000 with your actual dev server port (check your npm run dev output)
ngrok http 3000
```

You'll see something like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:3000
```

**Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

#### Step 3: Update TwiML App in Twilio Console

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Runtime** → **TwiML** → **TwiML Apps**
3. Click on your TwiML App (the one with SID matching `TWILIO_TWIML_APP_SID`)
4. Under **Voice Configuration**, update:
   - **Voice URL**: `https://abc123.ngrok.io/api/twilio/voice`
   - **Voice Method**: `POST`
5. Click **Save**

#### Step 4: Test Again

1. Make sure ngrok is still running
2. Click "Call Now" in the app
3. The call should work now!

### For Production

When you deploy to production:

1. Update your TwiML App's Voice URL to: `https://your-domain.com/api/twilio/voice`
2. Make sure your production server is accessible from the internet
3. Test the call again

## Troubleshooting

### "ngrok: command not found"
- Make sure ngrok is installed and in your PATH
- Try using the full path: `/path/to/ngrok http 3000`

### "ngrok URL changes every time"
- ngrok free tier gives you a new URL each time
- For production, use a fixed domain
- For testing, update the TwiML App URL each time you restart ngrok

### "Still getting application error"
1. Check that ngrok is running and shows your local server
2. Verify the Voice URL in Twilio Console matches your ngrok URL
3. Check the server terminal for webhook logs (you should see `[Twilio Voice] Webhook received`)
4. Check Twilio Console → Monitor → Logs for detailed error messages

### Check Server Logs

When you make a call, you should see in your server terminal:
```
[Twilio Voice] Webhook received: { to: '+18507656765', from: '+1234567890', ... }
[Twilio Voice] Generated TwiML: <?xml version="1.0" encoding="UTF-8"?>...
```

If you don't see these logs, Twilio can't reach your server.

## Quick Test

1. Start ngrok: `ngrok http 3000`
2. Copy the HTTPS URL
3. Update TwiML App Voice URL in Twilio Console
4. Make a test call
5. Check server terminal for webhook logs

If you see the webhook logs, the connection is working!

