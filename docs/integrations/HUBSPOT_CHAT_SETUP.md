# HubSpot Live Chat Setup

This guide will help you set up HubSpot Live Chat in the customer portal.

## Overview

The customer portal now includes HubSpot's Live Chat widget, allowing customers to:
- Chat directly with your support team
- Share pictures and files
- Have conversations automatically linked to tickets
- Access chat history in HubSpot

## Step 1: Enable Live Chat in HubSpot

1. Log in to your HubSpot account
2. Go to **Settings** (gear icon in top right)
3. Navigate to **Conversations** → **Chatflows**
4. If you don't have a chatflow yet, click **Create chatflow**
5. Choose **Website chat** or **Live chat**
6. Configure your chat widget (greeting message, availability, etc.)
7. Save your chatflow

## Step 2: Find Your Hub ID

Your Hub ID is needed to load the chat widget. You can find it in several ways:

### Method 1: From Chat Widget Code (EASIEST - Recommended)
1. Go to **Settings** → **Conversations** → **Chatflows**
2. If you don't have a chatflow yet:
   - Click **Create chatflow**
   - Choose **Website chat** or **Live chat**
   - Give it a name and click **Next**
   - Skip through the setup (you can configure it later)
   - Click **Finish**
3. Click on your chatflow to open it
4. Look for the **Installation** or **Embed** section
5. Even if it says "Embed using API", you can still find your Hub ID:
   - Look for any code snippet or URL that contains `js.hs-scripts.com`
   - The URL will look like: `//js.hs-scripts.com/12345678.js` or `https://js.hs-scripts.com/12345678.js`
   - The number `12345678` in the URL is your Hub ID
   - OR look for "Hub ID" or "Account ID" in the installation instructions

### Method 2: From Your HubSpot URL
1. While logged into HubSpot, look at your browser's address bar
2. The URL will look like one of these:
   - `app.hubspot.com/contacts/[HUB_ID]/...`
   - `app.hubspot.com/reports/[HUB_ID]/...`
   - `app.hubspot.com/[HUB_ID]/...`
3. The number in the URL path is your Hub ID

### Method 3: From Account Settings (Alternative)
1. Go to **Settings** (gear icon)
2. Look in one of these locations:
   - **Account Setup** → **Account Defaults** → Look for Hub ID
   - **Integrations** → **Connected Apps** → Look for Hub ID
   - **Account & Billing** → Look for Hub ID
3. If you still don't see it, try Method 1 or 2 above

### Method 4: Check Your HubSpot Domain
1. Go to **Settings** → **Account Setup** → **Account Defaults**
2. Look for **Hub domain** or **Account domain**
3. Sometimes the Hub ID is embedded in the domain or shown nearby

### Method 5: From API Documentation
1. Go to **Settings** → **Integrations** → **Private Apps**
2. If you have a private app, the Hub ID might be shown there
3. Or check your HubSpot API documentation URL - it often contains the Hub ID

### Still Can't Find It?
If none of these methods work:
1. Create a chatflow (Method 1) - this will definitely show you the Hub ID in the embed code
2. Contact HubSpot support - they can tell you your Hub ID
3. Check your HubSpot welcome email - sometimes it's included there

## Step 3: Add Hub ID to Environment Variables

1. Open your `.env.local` file in the project root
2. Add or update the `NEXT_PUBLIC_HUBSPOT_HUB_ID` line:
   ```
   NEXT_PUBLIC_HUBSPOT_HUB_ID="12345678"
   ```
3. Replace `12345678` with your actual Hub ID (keep the quotes)
4. Save the file
5. **Restart your dev server** for the changes to take effect

## Step 4: Configure Chat-to-Ticket Routing (Optional but Recommended)

To automatically create tickets from chat conversations:

1. Go to **Settings** → **Conversations** → **Chatflows**
2. Click on your chatflow
3. Go to **Routing** tab
4. Enable **Create ticket** option
5. Configure ticket properties:
   - Set ticket pipeline
   - Assign to team/member
   - Add ticket properties (priority, etc.)

## Step 5: Test the Chat Widget

1. Log in to the customer portal as a customer user
2. You should see the HubSpot chat widget in the bottom-right corner
3. Click on it to start a conversation
4. Test sending messages and files
5. Check HubSpot to verify the conversation appears

## How It Works

### User Identification
- When a customer logs in, the chat widget automatically identifies them
- Their email and name are passed to HubSpot
- This allows you to see who is chatting and link conversations to their company

### Chat-to-Ticket Integration
- Conversations in HubSpot can be converted to tickets
- Tickets created from chat are automatically linked to the customer's company
- Your team can respond in HubSpot, and customers see it in the chat

### File Sharing
- Customers can attach images and files directly in the chat
- Files are stored in HubSpot and linked to the conversation
- Techs can view files in HubSpot when responding

## Troubleshooting

### Chat widget not appearing
- **Check Hub ID**: Make sure `NEXT_PUBLIC_HUBSPOT_HUB_ID` is set correctly in `.env.local`
- **Restart server**: After adding the Hub ID, restart your dev server
- **Check browser console**: Look for any JavaScript errors
- **Verify chatflow**: Make sure your chatflow is published and active in HubSpot

### User not identified
- The chat widget will still work, but users won't be automatically identified
- This is okay - they can still chat, but you'll need to identify them manually in HubSpot

### Chat not creating tickets
- Make sure chat-to-ticket routing is enabled in your chatflow settings
- Check that your HubSpot account has Service Hub enabled
- Verify ticket pipeline is configured correctly

## Best Practices

1. **Set availability hours**: Configure when your team is available to chat
2. **Use canned responses**: Create quick replies for common questions
3. **Enable notifications**: Get notified when customers start chatting
4. **Link to tickets**: Always convert important conversations to tickets
5. **Train your team**: Make sure techs know how to use HubSpot chat

## Next Steps

- Configure chat routing rules
- Set up chat notifications
- Create canned responses for common questions
- Train your team on using HubSpot chat
- Consider adding chat analytics to track performance

