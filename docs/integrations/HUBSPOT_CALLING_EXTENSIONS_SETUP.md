# HubSpot Calling Extensions Setup

This document explains how to set up HubSpot Calling Extensions so that calls can be placed directly within the app.

## Overview

The app uses HubSpot's Calling Extensions SDK to embed calling functionality directly within the app. When a service tech clicks "Start Call", the call is initiated through HubSpot's calling system using your configured phone number, all within the app interface.

## How It Works

1. **Service Tech Clicks "Start Call"**: The app opens a modal with the HubSpot calling interface
2. **SDK Initialization**: The HubSpot Calling Extensions SDK initializes and connects to HubSpot
3. **Call Initiation**: The SDK initiates an outbound call to the customer's phone number
4. **Call Management**: The call is handled through HubSpot's calling system (using your configured phone number)
5. **Call Logging**: The call is automatically logged to HubSpot and associated with the contact, company, and ticket

## Setup Requirements

### 1. Register Your App as a HubSpot Calling Extension

You need to register your app with HubSpot as a calling extension:

1. **Go to HubSpot Developer Account**:

   - Visit https://developers.hubspot.com
   - Sign in with your HubSpot account

2. **Create a Private App** (if you haven't already):

   - Go to "Private Apps" in your developer account
   - Create a new private app
   - Note your App ID

3. **Register as Calling Extension**:
   - Your app needs to be registered as a calling extension in HubSpot
   - This typically requires submitting your app to HubSpot's marketplace or working with HubSpot directly
   - You'll need to provide:
     - App name: "Megabox Service Platform"
     - App URL: Your app's URL (e.g., `https://yourdomain.com`)
     - Callback URL: `https://yourdomain.com/api/hubspot/calling/callback` (if needed)

### 2. Configure Calling Settings

Once your app is registered, configure the calling settings via API:

```bash
curl --request PATCH \
  --url 'https://api.hubapi.com/crm/v3/extensions/calling/YOUR_APP_ID/settings?hapikey=YOUR_API_KEY' \
  --header 'accept: application/json' \
  --header 'content-type: application/json' \
  --data '{
    "supportsInboundCalling": false,
    "usesCallingWindow": true
  }'
```

Replace:

- `YOUR_APP_ID` with your HubSpot app ID
- `YOUR_API_KEY` with your HubSpot API key

### 3. Environment Variables

Make sure your `.env.local` has:

```
HUBSPOT_API_KEY=your_hubspot_api_key
```

### 4. HubSpot Calling Setup

Ensure HubSpot calling is configured in your HubSpot account:

1. Go to HubSpot Settings → Calling
2. Set up your phone number (the single number you mentioned)
3. Configure calling features (call recording, etc.)
4. Verify calling is available in your region

## How Calls Work

### For Service Techs

1. When a customer requests a phone call, it appears in "Communication Requests"
2. Tech clicks "Start Phone Call"
3. A modal opens with the HubSpot calling interface embedded
4. The call is automatically initiated to the customer's phone number
5. The call uses your HubSpot-configured phone number
6. Tech can manage the call through the embedded interface
7. When the call ends, it's automatically logged to HubSpot

### Call Flow

```
Service Tech clicks "Start Call"
    ↓
App opens calling modal
    ↓
HubSpot Calling SDK initializes
    ↓
SDK initiates outbound call via HubSpot
    ↓
Call connects through HubSpot's phone system
    ↓
Call is logged to HubSpot (contact, company, ticket)
    ↓
Call ends → Session updated in app
```

## Troubleshooting

### "Failed to load calling interface"

**Possible causes:**

1. App not registered as calling extension in HubSpot
2. SDK not properly initialized
3. HubSpot calling not configured in account

**Solutions:**

- Verify your app is registered in HubSpot Developer Portal
- Check browser console for SDK errors
- Ensure HubSpot calling is set up in your HubSpot account

### Calls Not Initiating

**Possible causes:**

1. Phone number format incorrect
2. HubSpot calling not available in region
3. App not properly registered

**Solutions:**

- Verify phone number format (should include country code, e.g., +1234567890)
- Check HubSpot calling availability in your region
- Verify app registration in HubSpot

### SDK Not Loading

**Possible causes:**

1. Package not installed
2. Import error
3. Network issues

**Solutions:**

- Run `npm install @hubspot/calling-extensions-sdk`
- Check browser console for import errors
- Verify network connectivity

## Alternative: Using HubSpot Calling URL

If the Calling Extensions SDK doesn't work (app not registered), the app falls back to:

1. Opening HubSpot's calling interface in a new window
2. Using `tel:` links as a last resort

## Testing

To test the calling functionality:

1. **Create a test communication request**:

   - As a customer, request a phone call
   - Provide a valid phone number

2. **As a service tech**:

   - Go to the ticket
   - Click "Start Phone Call" on the communication request
   - Verify the calling modal opens
   - Verify the call initiates

3. **Verify call logging**:
   - Check HubSpot to see if the call was logged
   - Verify it's associated with the correct contact, company, and ticket

## Notes

- The Calling Extensions SDK requires your app to be registered with HubSpot
- Calls are made through HubSpot's calling system using your configured phone number
- All calls are automatically logged to HubSpot
- The calling interface is embedded directly in your app (no new windows)
- Call duration and details are tracked in both HubSpot and your app's database

## Next Steps

1. Register your app with HubSpot as a calling extension
2. Configure calling settings via API
3. Test the calling functionality
4. Verify calls are being logged correctly in HubSpot

For more information, see:

- [HubSpot Calling Extensions Documentation](https://developers.hubspot.com/docs/api-reference/crm-calling-extensions-v3/calling-sdk)
- [HubSpot Developer Portal](https://developers.hubspot.com)
