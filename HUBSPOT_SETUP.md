# HubSpot Integration Setup

This guide will help you set up HubSpot CRM and Service Hub integration.

## Prerequisites

- HubSpot account with CRM and Service Hub access
- Admin access to create Private Apps in HubSpot

## Step 1: Create a HubSpot Private App

1. Log in to your HubSpot account
2. Go to **Settings** (gear icon in top right)
3. Navigate to **Integrations** → **Private Apps**
4. Click **Create a private app**
5. Give it a name (e.g., "Megabox Service Platform")
6. Under **Scopes**, grant the following permissions:
   - **CRM** → **Read** and **Write** access to Companies
   - **Service Hub** → **Read** and **Write** access to Tickets
7. Click **Create app**
8. Copy the **Access Token** (you'll need this for the next step)

## Step 2: Add API Key to Environment Variables

1. Open your `.env.local` file in the project root
2. Add or update the `HUBSPOT_API_KEY` line:
   ```
   HUBSPOT_API_KEY="your-access-token-here"
   ```
3. Replace `your-access-token-here` with the token you copied from Step 1
4. Save the file
5. **Restart your dev server** for the changes to take effect

## Step 3: Sync Your Data

### Sync Customers (Companies)

1. Go to **Customers** page in the admin panel
2. Click the **🔄 Sync from HubSpot** button
3. The system will:
   - Fetch all companies from HubSpot CRM
   - Create new companies in the database
   - Update existing companies that already have a HubSpot ID
   - Show you a summary of what was synced

### Sync Tickets

1. Go to **Tickets** page in the admin panel
2. Click the **🔄 Sync from HubSpot** button
3. The system will:
   - Fetch all tickets from HubSpot Service Hub
   - Create new tickets in the database
   - Update existing tickets that already have a HubSpot ID
   - Link tickets to companies based on HubSpot associations
   - Show you a summary of what was synced

## How It Works

### Two-Way Sync

- **Creating tickets in the app**: When you create a ticket in the app, it automatically creates a corresponding ticket in HubSpot Service Hub (if the company has a HubSpot ID)
- **Updating tickets**: When you update a ticket's status, priority, or other fields, it syncs back to HubSpot
- **Syncing from HubSpot**: Use the sync buttons to pull the latest data from HubSpot

### Data Mapping

- **Companies**: HubSpot companies sync to our `Company` model
- **Tickets**: HubSpot Service Hub tickets sync to our `Ticket` model
- **Status Mapping**: 
  - HubSpot `NEW` → Our `open`
  - HubSpot `IN_PROGRESS` → Our `in_progress`
  - HubSpot `RESOLVED` → Our `resolved`
  - HubSpot `CLOSED` → Our `closed`
- **Priority Mapping**:
  - HubSpot `LOW` → Our `low`
  - HubSpot `MEDIUM` → Our `medium`
  - HubSpot `HIGH` → Our `high`
  - HubSpot `URGENT` → Our `urgent`

## Troubleshooting

### "HubSpot API key is not configured" Error

- Make sure `HUBSPOT_API_KEY` is set in your `.env.local` file
- Restart your dev server after adding the key
- Check that the token is correct (no extra spaces or quotes)

### "No companies found" When Syncing Tickets

- Make sure you've synced companies first
- Tickets need to be associated with a company in HubSpot
- The system will try to match tickets to companies by HubSpot ID

### Sync Errors

- Check the browser console and server logs for detailed error messages
- Verify your HubSpot Private App has the correct scopes
- Make sure your HubSpot account has active CRM and Service Hub subscriptions

## Best Practices

1. **Initial Setup**: Sync companies first, then sync tickets
2. **Regular Syncs**: Run syncs periodically to keep data in sync
3. **HubSpot as Source of Truth**: For customers and tickets, HubSpot is the primary source
4. **Local Data**: Sites and machines are managed locally in the app

## Next Steps

- Set up automated webhooks from HubSpot (coming soon)
- Configure custom properties mapping (coming soon)
- Set up bi-directional sync scheduling (coming soon)


