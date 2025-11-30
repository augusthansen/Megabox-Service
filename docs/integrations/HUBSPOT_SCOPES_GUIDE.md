# HubSpot Private App Scopes Guide

This guide explains what scopes you need to add to your existing HubSpot private app for all the features in this application.

## Current Scopes (You Probably Already Have)

For tickets and companies to work, you should already have:
- ✅ **CRM** → **Read** and **Write** access to **Companies**
- ✅ **Service Hub** → **Read** and **Write** access to **Tickets**
- ✅ **CRM** → **Read** and **Write** access to **Contacts** (for syncing contacts/users)

## Additional Scopes Needed for Calling

To enable HubSpot calling functionality, you may need to add these scopes:

### Optional but Recommended:

1. **Engagements** → **Read** and **Write** access (if available)
   - **Why**: This allows the app to log phone calls to HubSpot as engagements/notes
   - **Used for**: Creating call activities when calls are made
   - **Note**: This scope may not be available in all HubSpot subscription tiers. If you don't see it, that's okay - calls will still work, they just won't be automatically logged to HubSpot.

2. **Timeline** → **Read** and **Write** access (if available)
   - **Why**: This is helpful for the Calling Extensions SDK to work fully
   - **Used for**: Managing call timeline events
   - **Note**: This may not be available in all HubSpot accounts

### What If I Don't Have These Scopes?

**Don't worry!** The calling functionality will still work:
- ✅ Calls can still be placed through HubSpot's calling interface
- ✅ Calls will still use your HubSpot phone number
- ⚠️ Calls won't be automatically logged to HubSpot (but you can log them manually)
- ✅ The app will still track call sessions in your database

The app is designed to work even without these scopes - it will gracefully handle missing permissions.

## How to Add Scopes

### Step-by-Step Instructions:

1. **Log in to HubSpot**
   - Go to https://app.hubspot.com

2. **Go to Settings**
   - Click the gear icon (⚙️) in the top right corner

3. **Navigate to Private Apps**
   - Go to **Integrations** → **Private Apps**
   - Find your existing private app (the one you created for tickets)
   - Click on it to edit

4. **Add the New Scopes**
   - Scroll down to the **Scopes** section
   - Look for **Engagements**:
     - Check the box for **Read** access
     - Check the box for **Write** access
   - Look for **Timeline**:
     - Check the box for **Read** access
     - Check the box for **Write** access

5. **Save Changes**
   - Click **Save** at the bottom of the page
   - HubSpot will regenerate your access token

6. **Update Your Environment Variable**
   - Copy the new **Access Token** from the private app page
   - Update `HUBSPOT_API_KEY` in your `.env.local` file with the new token
   - **Important**: The old token will stop working, so you must update it!

7. **Restart Your Dev Server**
   - Stop your dev server (Ctrl+C)
   - Start it again: `npm run dev`

## Complete List of Scopes You Should Have

Here's the full list of scopes your private app should have:

### CRM
- ✅ **Companies** → Read, Write
- ✅ **Contacts** → Read, Write
- ✅ **Engagements** → Read, Write (NEW - for calling)

### Service Hub
- ✅ **Tickets** → Read, Write

### Timeline
- ✅ **Timeline** → Read, Write (NEW - for calling extensions)

## Visual Guide

When you're in the Private App settings, the Scopes section should look something like this:

```
Scopes
├── CRM
│   ├── ☑ Companies (Read, Write)
│   ├── ☑ Contacts (Read, Write)
│   └── ☑ Engagements (Read, Write) ← ADD THIS
├── Service Hub
│   └── ☑ Tickets (Read, Write)
└── Timeline
    └── ☑ Timeline (Read, Write) ← ADD THIS
```

## Testing

After adding the scopes and updating your API key:

1. **Test Ticket Sync**: Go to Tickets page and click "Sync from HubSpot" - should still work
2. **Test Contact Sync**: Go to Users page and click "Sync from HubSpot" - should still work
3. **Test Call Logging**: Try making a phone call - it should log to HubSpot

## Troubleshooting

### "Insufficient permissions" Error

- **Cause**: Missing required scopes
- **Fix**: Make sure you added **Engagements** and **Timeline** scopes

### "Invalid API key" Error

- **Cause**: The access token changed when you updated scopes
- **Fix**: Copy the new token from the private app page and update `.env.local`

### Calls Not Logging to HubSpot

- **Cause**: Missing Engagements scope
- **Fix**: Add **Engagements** → **Write** scope

### Calling Extensions SDK Not Working

- **Cause**: Missing Timeline scope or app not registered as calling extension
- **Fix**: 
  1. Add **Timeline** → **Read, Write** scope
  2. Register your app as a calling extension (see `HUBSPOT_CALLING_EXTENSIONS_SETUP.md`)

## Important Notes

- ⚠️ **When you add scopes, HubSpot generates a NEW access token**
- ⚠️ **You MUST update `HUBSPOT_API_KEY` in `.env.local` with the new token**
- ⚠️ **The old token will stop working immediately**
- ✅ **Your existing functionality (tickets, companies) will continue to work**
- ✅ **Adding scopes doesn't break anything - it just gives more permissions**

## Quick Checklist

- [ ] Added **Engagements** → Read, Write scopes
- [ ] Added **Timeline** → Read, Write scopes
- [ ] Copied the new access token from HubSpot
- [ ] Updated `HUBSPOT_API_KEY` in `.env.local`
- [ ] Restarted the dev server
- [ ] Tested that tickets still sync
- [ ] Tested that calls can be logged

That's it! Once you add these scopes and update your API key, the calling functionality will work.

