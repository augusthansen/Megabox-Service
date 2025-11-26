# HubSpot Tickets Integration

This document explains how the HubSpot Service Hub tickets integration works in the Megabox Service Platform.

## Overview

The platform provides **two-way synchronization** between HubSpot Service Hub tickets and the local database:

1. **HubSpot → App**: Sync existing tickets from HubSpot Service Hub into the platform
2. **App → HubSpot**: Automatically create/update tickets in HubSpot when managing tickets in the platform

## Features

### ✅ Sync Tickets from HubSpot

- Fetch all tickets from your HubSpot Service Hub
- Automatically match tickets to companies based on HubSpot associations
- Map HubSpot ticket properties (status, priority, subject, description) to the platform
- Update existing tickets if they've been synced before

### ✅ Create Tickets in HubSpot

- When you create a ticket in the platform, it's automatically created in HubSpot
- The ticket is associated with the correct company in HubSpot
- All ticket details (subject, description, priority) are synced

### ✅ Update Tickets in HubSpot

- When you update a ticket in the platform, the changes are automatically synced to HubSpot
- Updates include: status, priority, subject, and description

### ✅ View Tickets in HubSpot

- Each ticket in the platform shows a direct link to view/edit it in HubSpot
- Click the HubSpot icon in the tickets list or detail page
- Opens the ticket in a new tab in your HubSpot portal

## How to Use

### 1. Sync Existing Tickets from HubSpot

1. Navigate to **Admin → Tickets**
2. Click the **"Sync from HubSpot"** button (green button with sync icon)
3. Wait for the sync to complete
4. You'll see a summary:
   - Number of new tickets synced
   - Number of existing tickets updated
   - Any errors encountered

### 2. Create New Tickets

When you create a ticket in the platform:
- Fill out the ticket form (company, site, machine, subject, description, priority)
- Click **"Create Ticket"**
- The ticket is saved locally AND created in HubSpot automatically
- The ticket will be associated with the correct company in HubSpot

### 3. Update Tickets

When you update a ticket:
- Click **"View Details"** on any ticket
- Click **"Edit Ticket"**
- Make your changes (status, priority, subject, description, assigned user)
- Click **"Save Changes"**
- The changes are saved locally AND updated in HubSpot automatically

### 4. View in HubSpot

To open a ticket in HubSpot:
- Look for the orange HubSpot icon next to any ticket
- Click it to open the ticket in HubSpot in a new tab
- Make advanced changes or view full ticket history in HubSpot

## Status Mapping

The platform maps ticket statuses between the app and HubSpot:

| Platform Status | HubSpot Status |
|----------------|----------------|
| Open | NEW |
| Assigned | OPEN |
| In Progress | IN_PROGRESS |
| On Hold | WAITING |
| Resolved | RESOLVED |
| Closed | CLOSED |

## Priority Mapping

Priority levels are mapped as follows:

| Platform Priority | HubSpot Priority |
|------------------|------------------|
| Low | LOW |
| Medium | MEDIUM |
| High | HIGH |
| Urgent | URGENT |

## Company Association

For tickets to sync correctly:

1. **HubSpot → App**: The company must already exist in your database (synced via the "Sync from HubSpot" button on the Customers page)
2. **App → HubSpot**: The company must have a `hubspotId` (it should be synced from HubSpot)

If a ticket in HubSpot is associated with a company that doesn't exist in your database, the ticket will still sync but won't have a company assigned.

## Technical Details

### API Endpoints

- `POST /api/hubspot/sync-tickets`: Syncs tickets from HubSpot to the app
- `POST /api/tickets`: Creates a ticket in both the app and HubSpot
- `PATCH /api/tickets/[id]`: Updates a ticket in both the app and HubSpot

### HubSpot Utilities

See `lib/hubspot.ts` for the following functions:

- `syncTicketsFromHubspot()`: Fetches tickets from HubSpot with company associations
- `createTicketInHubspot()`: Creates a new ticket in HubSpot
- `updateTicketInHubspot()`: Updates an existing ticket in HubSpot
- `getHubspotTicketUrl()`: Generates a URL to view a ticket in HubSpot

### Database Schema

Tickets have a `hubspotId` field that stores the HubSpot ticket ID for synced tickets:

```prisma
model Ticket {
  id            String   @id @default(cuid())
  hubspotId     String?  @unique  // HubSpot ticket ID
  ticketNumber  String   @unique
  subject       String
  description   String?
  // ... other fields
}
```

## Troubleshooting

### Tickets Not Syncing

1. **Check HubSpot API Key**: Ensure `HUBSPOT_API_KEY` is set in `.env.local`
2. **Check Permissions**: Your HubSpot API key needs access to the Tickets API (Service Hub)
3. **Check Company Sync**: Companies must be synced first for ticket associations to work

### Tickets Missing Company Association

1. **Sync Companies First**: Make sure the company exists in your database
2. **Check HubSpot Association**: Verify the ticket is associated with a company in HubSpot
3. **Re-sync Tickets**: Try syncing tickets again after companies are synced

### Updates Not Syncing to HubSpot

1. **Check hubspotId**: Only tickets with a `hubspotId` will sync updates to HubSpot
2. **Check API Permissions**: Ensure your HubSpot API key has write permissions
3. **Check Console**: Look for error messages in the browser console or server logs

## Best Practices

1. **Sync Companies First**: Always sync companies from HubSpot before syncing tickets
2. **Regular Syncs**: Periodically click "Sync from HubSpot" to pull in new tickets
3. **Use Platform for Updates**: Update tickets in the platform to ensure changes are tracked both places
4. **Check HubSpot for Advanced Features**: For advanced ticket management (custom fields, workflows), use HubSpot directly

## Future Enhancements

Potential improvements to the HubSpot tickets integration:

- [ ] Automatic periodic syncing (scheduled background job)
- [ ] Webhook integration for real-time updates from HubSpot
- [ ] Sync ticket comments/notes between platforms
- [ ] Sync ticket attachments
- [ ] Support for custom HubSpot ticket properties
- [ ] Sync contact associations (in addition to company associations)
- [ ] Filter tickets by date range or status when syncing
- [ ] Batch operations (close multiple tickets at once)

---

For more information about HubSpot setup, see [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md).

