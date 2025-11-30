# HubSpot Calling Integration Setup

This document explains how HubSpot calling is integrated into the app and how to set it up.

## Overview

The app integrates with HubSpot's calling functionality to:
1. Initiate phone calls through HubSpot's calling interface
2. Log call activities to HubSpot (associated with contacts, companies, and tickets)
3. Track call sessions in the app's database

## How It Works

When a service tech clicks "Start Phone Call" for a scheduled communication request:

1. **Call Initiation**: The app calls `/api/calls/hubspot` which:
   - Creates a call activity/engagement in HubSpot
   - Associates the call with the contact, company, and ticket
   - Returns a HubSpot calling URL

2. **Opening HubSpot Calling**: The app opens HubSpot's calling interface in a new window/tab where the tech can:
   - Make the call using HubSpot's calling system
   - Use your configured phone number
   - Record the call (if enabled in HubSpot)

3. **Call Logging**: The call is automatically logged to HubSpot as a note engagement, linked to:
   - The contact (customer)
   - The company
   - The ticket

## Setup Requirements

### 1. HubSpot Calling Configuration

You need to have HubSpot calling set up in your HubSpot account:

1. **Enable HubSpot Calling**:
   - Go to HubSpot Settings → Calling
   - Set up your phone number (the single number you mentioned)
   - Configure calling features (call recording, etc.)

2. **Verify Calling is Available**:
   - HubSpot calling is available in specific countries
   - Check HubSpot's Global Calling Functionality page to verify your region is supported

### 2. API Key

Make sure your `HUBSPOT_API_KEY` is set in `.env.local`:
```
HUBSPOT_API_KEY=your_api_key_here
```

### 3. HubSpot Contact IDs

For proper call logging, ensure:
- Contacts (users) have `hubspotId` set in the database
- Companies have `hubspotId` set in the database
- Tickets have `hubspotId` set in the database

These are automatically set when:
- Contacts are synced from HubSpot
- Companies are synced from HubSpot
- Tickets are created/synced from HubSpot

## Usage

### For Service Techs

1. When a customer requests a phone call, it appears in the "Communication Requests" section
2. Click "Start Phone Call" when ready
3. HubSpot's calling interface opens in a new window
4. Make the call through HubSpot
5. The call is automatically logged to HubSpot and linked to the ticket

### Fallback Behavior

If HubSpot calling is not available or fails:
- The app falls back to using `tel:` links (standard phone dialer)
- This ensures calls can still be made even if HubSpot integration fails

## API Endpoints

### POST `/api/calls/hubspot`

Initiates a HubSpot call and returns the calling URL.

**Request Body:**
```json
{
  "ticketId": "ticket_id",
  "phoneNumber": "+1234567890",
  "techId": "tech_user_id",
  "contactId": "contact_user_id (optional)",
  "companyId": "company_id (optional)",
  "direction": "OUTBOUND"
}
```

**Response:**
```json
{
  "success": true,
  "callingUrl": "https://app.hubspot.com/contacts/calling?phone=...",
  "hubspotEngagementId": "engagement_id",
  "message": "Call initiated..."
}
```

## Troubleshooting

### Calls Not Opening HubSpot Interface

1. **Check HubSpot Calling Setup**: Verify calling is enabled in HubSpot Settings
2. **Check API Key**: Ensure `HUBSPOT_API_KEY` is set correctly
3. **Check Browser**: Some browsers may block popups - allow popups for your app domain
4. **Fallback**: The app will fall back to `tel:` links if HubSpot fails

### Call Activities Not Logging

1. **Check API Key**: Ensure `HUBSPOT_API_KEY` has proper permissions
2. **Check HubSpot IDs**: Verify contacts, companies, and tickets have `hubspotId` set
3. **Check Logs**: Check server console for error messages

### HubSpot Calling Not Available in Your Region

If HubSpot calling is not available in your region:
- The app will fall back to `tel:` links
- Consider using a third-party calling service integrated with HubSpot (Aircall, etc.)

## Third-Party Calling Integrations

If you're using a third-party calling service (like Aircall) integrated with HubSpot:

1. The integration should work through HubSpot's interface
2. Calls made through HubSpot will still be logged
3. You may need to configure the third-party service separately

## Notes

- Call duration and notes can be added after the call is completed
- The app tracks call sessions in the database for billing/time tracking
- HubSpot call logging happens asynchronously - calls can proceed even if logging fails

