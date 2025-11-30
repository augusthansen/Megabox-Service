# Twilio Setup Guide

## Why Twilio?

Twilio provides a more reliable and flexible calling solution compared to HubSpot's native calling:
- ✅ Works on web and mobile
- ✅ Can embed calling interface directly in the app
- ✅ More control over the calling experience
- ✅ Still logs calls to HubSpot after completion
- ✅ Better international calling support

## Setup Steps

### Step 1: Get Your Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Log in to your account
3. Get your **Account SID** and **Auth Token**:
   - Dashboard → Account Info
   - Copy `Account SID` and `Auth Token`

### Step 2: Create an API Key

1. In Twilio Console, go to **Account** → **API Keys & Tokens**
2. Click **Create API Key**
3. Give it a name (e.g., "Megabox Service App")
4. Copy the **API Key SID** and **API Secret** (you'll only see the secret once!)

### Step 3: Get Your Twilio Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Copy your phone number (in E.164 format, e.g., `+1234567890`)
3. If you don't have a number, buy one:
   - Go to **Phone Numbers** → **Buy a Number**
   - Choose a number with voice capabilities

### Step 4: Create a TwiML App

1. In Twilio Console, go to **Runtime** → **TwiML** → **TwiML Apps**
2. Click **Create new TwiML App**
3. Give it a name (e.g., "Megabox Calling")
4. Set the **Voice Configuration**:
   - **Voice URL**: `https://your-domain.com/api/twilio/voice`
   - **Voice Method**: `POST`
   - For local development, use ngrok: `https://your-ngrok-url.ngrok.io/api/twilio/voice`
5. Click **Save**
6. Copy the **TwiML App SID**

### Step 5: Update Your Environment Variables

Add these to your `.env.local` file:

```env
# Twilio
TWILIO_ACCOUNT_SID="your-account-sid-here"
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_API_KEY="your-api-key-sid-here"
TWILIO_API_SECRET="your-api-secret-here"
TWILIO_PHONE_NUMBER="+1234567890"
TWILIO_TWIML_APP_SID="your-twiml-app-sid-here"
```

### Step 6: For Local Development (ngrok)

If you're testing locally, you'll need ngrok to expose your local server:

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com/)
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Update your TwiML App's Voice URL to: `https://abc123.ngrok.io/api/twilio/voice`
5. Update `NEXTAUTH_URL` in `.env.local` to the ngrok URL

## How It Works

1. **User clicks "Start Call"** → Opens Twilio calling interface
2. **User clicks "Call Now"** → Twilio makes the call
3. **Call is connected** → User talks through the browser
4. **Call ends** → Duration is tracked and logged to HubSpot

## Testing

1. Make sure all environment variables are set
2. Restart your dev server
3. Try clicking "Start Call" on a phone call request
4. You should see the Twilio calling interface
5. Click "Call Now" to make the call

## Troubleshooting

### "Device not ready" error
- Check that all Twilio environment variables are set
- Check browser console for errors
- Verify your TwiML App Voice URL is correct

### "Failed to get Twilio token"
- Check that `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, and `TWILIO_API_SECRET` are correct
- Verify the API key is active in Twilio Console

### Calls not connecting
- Check that `TWILIO_PHONE_NUMBER` is correct (E.164 format)
- Verify your TwiML App Voice URL is accessible
- Check Twilio Console → Monitor → Logs for errors

### For Production
- Update TwiML App Voice URL to your production domain
- Make sure your production server is accessible
- Consider using Twilio's webhook validation for security

