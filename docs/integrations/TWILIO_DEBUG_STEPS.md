# 🔍 Debugging Twilio "Application Error"

## Step 1: Verify Webhook is Accessible

1. **Get your ngrok URL** (e.g., `https://abc123.ngrok.io`)
2. **Test the webhook endpoint** in your browser:
   ```
   https://abc123.ngrok.io/api/twilio/voice
   ```
3. **You should see:**
   ```json
   {
     "status": "ok",
     "message": "Twilio voice webhook is accessible",
     "timestamp": "..."
   }
   ```
4. **If you get an error**, ngrok isn't working or the URL is wrong

## Step 2: Check Server Logs

When you click "Call Now", check your **server terminal** (where `npm run dev` is running).

**You should see:**
```
[Twilio Voice] Webhook received: { to: '+18507656765', from: 'client:...', ... }
[Twilio Voice] Generated TwiML: <?xml version="1.0" encoding="UTF-8"?>...
```

**If you DON'T see these logs:**
- Twilio can't reach your webhook
- Check that ngrok is running
- Verify the TwiML App Voice URL in Twilio Console matches your ngrok URL

## Step 3: Check Twilio Console Logs

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to **Monitor** → **Logs** → **Calls**
3. Find your failed call
4. Click on it to see the error details
5. Look for:
   - **Error Code** (e.g., 11200, 11205)
   - **Error Message**
   - **Request URL** (should be your ngrok URL)

## Step 4: Verify TwiML App Configuration

1. Go to **Runtime** → **TwiML** → **TwiML Apps**
2. Click on your app
3. Verify:
   - **Voice URL**: `https://your-ngrok-url.ngrok.io/api/twilio/voice`
   - **Voice Method**: `POST`
   - **TwiML App SID**: Copy this and verify it matches `TWILIO_TWIML_APP_SID` in `.env.local`

## Step 5: Check Environment Variables

Make sure these are set in `.env.local`:

```env
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="your-token"
TWILIO_API_KEY="SK..."
TWILIO_API_SECRET="your-secret"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_TWIML_APP_SID="AP..."  # This must match the TwiML App SID in Twilio Console
```

## Step 6: Common Issues

### Issue: "11200 - HTTP retrieval failure"
**Cause:** Twilio can't reach your webhook URL
**Fix:**
- Make sure ngrok is running
- Verify the Voice URL in TwiML App matches your ngrok URL
- Check that your server is running

### Issue: "11205 - HTTP connection failure"
**Cause:** The webhook URL is incorrect or returns an error
**Fix:**
- Test the webhook URL in your browser (should return JSON)
- Check server logs for errors
- Verify the URL doesn't have typos

### Issue: "No webhook logs in server terminal"
**Cause:** Twilio isn't calling your webhook
**Fix:**
- Double-check the TwiML App Voice URL
- Make sure ngrok is forwarding to the correct port
- Restart ngrok and update the TwiML App URL

### Issue: "TwiML App SID mismatch"
**Cause:** The SID in `.env.local` doesn't match the one in Twilio Console
**Fix:**
- Copy the TwiML App SID from Twilio Console
- Update `TWILIO_TWIML_APP_SID` in `.env.local`
- Restart your dev server

## Step 7: Test the Full Flow

1. **Start ngrok**: `ngrok http 3000`
2. **Update TwiML App Voice URL** in Twilio Console
3. **Restart dev server**: `npm run dev`
4. **Test webhook**: Visit `https://your-ngrok-url.ngrok.io/api/twilio/voice` in browser
5. **Make a call** from the app
6. **Check server logs** for webhook request
7. **Check Twilio Console** for call logs

## What to Share for Help

If it's still not working, share:
1. **Server terminal logs** (when you click "Call Now")
2. **Twilio Console error** (from Monitor → Logs → Calls)
3. **Webhook test result** (from Step 1)
4. **TwiML App SID** (first 3 characters, e.g., "AP1...")

