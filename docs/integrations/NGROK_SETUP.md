# 🔐 ngrok Setup Guide

## Step 1: Sign Up for ngrok (Free)

1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account (you can use Google/GitHub to sign up quickly)
3. Verify your email if needed

## Step 2: Get Your Authtoken

1. After signing up, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. You'll see your authtoken (looks like: `2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5`)
3. **Copy this token** (you'll need it in the next step)

## Step 3: Configure ngrok

In your terminal, run:

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

Replace `YOUR_AUTHTOKEN_HERE` with the token you copied from Step 2.

**Example:**
```bash
ngrok config add-authtoken 2abc123def456ghi789jkl012mno345pq_6r7s8t9u0v1w2x3y4z5
```

You should see: `Authtoken saved to configuration file: /Users/yourname/.ngrok2/ngrok.yml`

## Step 4: Start ngrok

Now you can start ngrok:

```bash
ngrok http 3000
```

(Replace `3000` with `3001` if your dev server is on port 3001)

You'll see:
```
Forwarding   https://abc123xyz.ngrok.io -> http://localhost:3000
```

## Step 5: Update Twilio Console

1. Copy the HTTPS URL from ngrok (e.g., `https://abc123xyz.ngrok.io`)
2. Go to [Twilio Console](https://console.twilio.com/)
3. Navigate to **Runtime** → **TwiML** → **TwiML Apps**
4. Click on your app
5. Update **Request URL** to: `https://YOUR_NGROK_URL.ngrok.io/api/twilio/voice`
6. Click **Save**

## That's It!

Now try making a call from your app. It should work!

## Note

- Keep ngrok running in a separate terminal window
- If you restart ngrok, you'll get a new URL (free tier)
- Update the TwiML App URL in Twilio Console each time you restart ngrok

