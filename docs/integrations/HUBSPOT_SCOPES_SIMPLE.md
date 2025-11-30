# HubSpot Scopes - Simple Guide

## What You Need

Since you already have a private app set up for tickets, here's what you need to check:

## Current Scopes (You Should Already Have)

✅ **CRM** → **Companies** (Read, Write)  
✅ **CRM** → **Contacts** (Read, Write)  
✅ **Service Hub** → **Tickets** (Read, Write)

## Additional Scopes (Optional)

If you see these in your HubSpot private app settings, you can add them:

- **Engagements** (Read, Write) - For logging calls automatically
- **Timeline** (Read, Write) - For calling extensions SDK

## What If I Don't See "Engagements"?

**That's totally fine!** The calling feature will still work. Here's what happens:

### With Engagements Scope:
- ✅ Calls are automatically logged to HubSpot
- ✅ Call details appear in HubSpot timeline

### Without Engagements Scope:
- ✅ Calls still work perfectly
- ✅ Calls still use your HubSpot phone number
- ✅ Calls are tracked in the app's database
- ⚠️ Calls won't automatically log to HubSpot (but you can add notes manually)

## How to Check Your Current Scopes

1. Go to HubSpot → Settings → Integrations → Private Apps
2. Click on your private app
3. Scroll to the **Scopes** section
4. Look for what's available

## What You Need for Calling to Work

**Minimum Required:**
- ✅ Your existing scopes (Companies, Contacts, Tickets)
- ✅ HubSpot calling configured in your HubSpot account
- ✅ A phone number set up in HubSpot

**Nice to Have (but not required):**
- Engagements scope (for automatic call logging)
- Timeline scope (for full SDK features)

## Bottom Line

**You don't need to add any new scopes for calling to work!** 

The calling feature will work with your existing scopes. Adding Engagements and Timeline scopes just adds extra features (automatic logging), but they're not required.

Just make sure:
1. Your HubSpot calling is set up (phone number configured)
2. Your existing API key is working
3. That's it!

