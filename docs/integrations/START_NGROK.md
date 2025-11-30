# 🚀 How to Start ngrok

## What is ngrok?

**ngrok** is a tool that makes your local server (running on `localhost:3000`) accessible from the internet. Twilio needs to reach your webhook, but `localhost` isn't accessible from the internet, so ngrok creates a public URL that forwards to your local server.

## Step 1: Find Your Dev Server Port

1. Look at the terminal where `npm run dev` is running
2. It should say something like: `Local: http://localhost:3000` or `Local: http://localhost:3001`
3. **Remember this port number** (3000 or 3001)

## Step 2: Start ngrok

1. **Open a NEW terminal window** (don't close your dev server terminal!)
2. **Run this command** (replace `3000` with your actual port if different):
   ```bash
   ngrok http 3000
   ```
   OR if your dev server is on port 3001:
   ```bash
   ngrok http 3001
   ```

3. **You'll see something like this:**
   ```
   Session Status                online
   Account                       Your Name
   Forwarding                    https://abc123xyz.ngrok.io -> http://localhost:3000
   ```

4. **Copy the HTTPS URL** (the `https://abc123xyz.ngrok.io` part)

## Step 3: Update Twilio Console

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Runtime** → **TwiML** → **TwiML Apps**
3. Click on your app (the one with SID: `AP1987d02cfaa5dc20a4419afe3d3f053a`)
4. Under **Voice Configuration**, update:
   - **Request URL**: `https://YOUR_NGROK_URL.ngrok.io/api/twilio/voice`
     (Replace `YOUR_NGROK_URL` with the URL from Step 2)
   - **Request Method**: `HTTP POST` (should already be set)
5. Click **Save**

## Step 4: Keep ngrok Running

**Important:** Keep the ngrok terminal window open while testing calls. If you close it, the URL will stop working.

## Step 5: Test

1. Make sure both terminals are running:
   - Terminal 1: `npm run dev` (your app)
   - Terminal 2: `ngrok http 3000` (or 3001)
2. Try making a call from the app
3. Check your dev server terminal for `[Twilio Voice]` logs

## Troubleshooting

### "ngrok: command not found"
- ngrok is installed, so this shouldn't happen
- Try: `/opt/homebrew/bin/ngrok http 3000`

### "Address already in use"
- Another ngrok instance might be running
- Kill it: `pkill ngrok`
- Then start again: `ngrok http 3000`

### ngrok URL changes every time
- This is normal for the free tier
- Just update the TwiML App URL in Twilio Console each time

