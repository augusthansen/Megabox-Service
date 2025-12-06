# Fix Twilio Recording Callback URL Error

## The Error

```
A recording was initiated using an invalid URL for the recordingStatusCallback parameter. 
The recording will be processed, but status notifications will not be sent.
```

## The Problem

Twilio cannot reach your `recordingStatusCallback` URL because:
- `NEXTAUTH_URL` is set to `http://localhost:3000` (not accessible from Twilio's servers)
- The URL must be publicly accessible (HTTPS or ngrok URL)

## The Solution

Update your `.env.local` file to use your ngrok URL:

### Step 1: Get Your Current ngrok URL

1. Check your ngrok terminal window
2. Look for the forwarding line, e.g.:
   ```
   https://windowy-vena-scientifically.ngrok-free.dev -> http://localhost:3000
   ```

### Step 2: Update NEXTAUTH_URL

Open `.env.local` and update:

```env
NEXTAUTH_URL=https://windowy-vena-scientifically.ngrok-free.dev
```

**Important**: Use the **HTTPS** ngrok URL, not `http://localhost:3000`

### Step 3: Restart Your Dev Server

1. Stop your dev server (Ctrl+C)
2. Restart it: `npm run dev`
3. Make a test call

### Step 4: Verify the Fix

1. Make a phone call through the app
2. Check Twilio Console → Monitor → Logs → Errors
3. The error should no longer appear
4. Check your server terminal for `[Twilio Recording]` webhook logs

## Alternative: Use TWILIO_WEBHOOK_URL

If you want to use a different URL specifically for Twilio webhooks, you can add:

```env
TWILIO_WEBHOOK_URL=https://windowy-vena-scientifically.ngrok-free.dev
```

The code will use this if available, otherwise it falls back to `NEXTAUTH_URL`.

## Testing the Webhook

You can test if the webhook is accessible:

1. Open: `https://your-ngrok-url.ngrok-free.dev/api/twilio/recording-status`
2. You should see: `{"status":"ok","message":"Twilio recording webhook is accessible",...}`

If you get an error, the URL is not accessible from the internet.

## Important Notes

- **ngrok URLs change**: If you restart ngrok, you'll get a new URL and need to update `NEXTAUTH_URL`
- **For production**: Use your production domain (e.g., `https://yourdomain.com`)
- **HTTPS required**: Twilio requires HTTPS URLs (ngrok provides this automatically)

## Quick Fix Script

Run this to update your `.env.local` with the current ngrok URL:

```bash
# Replace YOUR_NGROK_URL with your actual ngrok URL
sed -i '' 's|NEXTAUTH_URL=.*|NEXTAUTH_URL=https://YOUR_NGROK_URL.ngrok-free.dev|' .env.local
```

Then restart your dev server.

