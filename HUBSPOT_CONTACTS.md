# HubSpot Contacts Integration

This document explains how the HubSpot contact associations feature works in the Megabox Service Platform.

## Overview

The platform now syncs **HubSpot contacts** to local users and associates them with tickets, providing complete context for who created or is involved in each service request.

## What Changed

### Database Schema

Added `hubspotId` field to the `User` model:

```prisma
model User {
  id         String   @id @default(cuid())
  email      String   @unique
  name       String
  hubspotId  String?  @unique  // HubSpot contact ID
  // ... other fields
}
```

This allows us to link users in our system to contacts in HubSpot.

### New Features

1. **Sync Contacts from HubSpot**
   - Fetch contacts from HubSpot CRM
   - Create new users for contacts associated with service plan companies
   - Update existing users with HubSpot contact IDs
   - Link users to their companies based on HubSpot associations

2. **Contact-Associated Tickets**
   - Tickets created in the app are associated with the creator's HubSpot contact
   - Tickets synced from HubSpot include the associated contact as the creator
   - Full context of who submitted each ticket

3. **Visual HubSpot Links**
   - HubSpot icon next to users who are synced contacts
   - Click to view the contact in HubSpot
   - Easy access to full contact history and details

## How to Use

### 1. Sync Contacts from HubSpot

**Prerequisites:**
- Sync companies first (so contacts can be associated with companies)
- Ensure `HUBSPOT_API_KEY` is set in your `.env.local`

**Steps:**
1. Navigate to **Admin → Users**
2. Click the **"Sync from HubSpot"** button (green button with sync icon)
3. Wait for the sync to complete
4. Review the sync summary:
   - **Synced**: New contacts created as users
   - **Updated**: Existing users linked to HubSpot contacts
   - **Skipped**: Contacts without companies or email addresses
   - **Errors**: Any sync failures

**Important Notes:**
- Only contacts associated with companies that have service plans are synced
- Contacts without email addresses are skipped
- New users are created with the role `customer_admin` by default
- A random password is generated for new users (they'll need to reset it)

### 2. View Contact Details in HubSpot

When viewing the Users page:
- Look for the orange HubSpot icon next to user names
- Click the icon to open the contact in HubSpot in a new tab
- View full contact history, communications, and details

### 3. Contact-Associated Tickets

When creating or viewing tickets:
- Tickets automatically associate with the creator's HubSpot contact
- If the user has a `hubspotId`, the ticket is linked in HubSpot
- Synced tickets from HubSpot preserve the contact association

## Sync Behavior

### Creating New Users from HubSpot Contacts

When syncing, the system will:

1. **Check for existing user by HubSpot ID**
   - If found: Update user details (name, email, company)

2. **Check for existing user by email**
   - If found: Link the HubSpot ID to the existing user

3. **Create new user if:**
   - Contact has an email address
   - Contact is associated with a synced company
   - No existing user with that email or HubSpot ID

**Generated Credentials:**
- Email: From HubSpot contact
- Name: `{firstname} {lastname}` from HubSpot
- Password: Random (user must reset)
- Role: `customer_admin`
- Status: Active

### Filtering Logic

The sync will **skip** contacts if:
- ❌ No email address
- ❌ Not associated with any company
- ❌ Associated company doesn't exist in local database
- ❌ Associated company doesn't have a service plan

This ensures only relevant contacts (customers with service plans) are synced.

## Contact-Ticket Association Details

### When Creating Tickets in the App

```typescript
// System checks if the creator has a hubspotId
const creator = await prisma.user.findUnique({
  where: { id: createdById },
  select: { hubspotId: true },
});

// If they do, associate the contact with the ticket in HubSpot
await createTicketInHubspot({
  subject: "Machine Down",
  companyId: company.hubspotId,
  contactId: creator?.hubspotId, // 🎯 Contact association
});
```

### When Syncing Tickets from HubSpot

```typescript
// System looks for contact associations
if (ticket.associations?.contacts?.results?.length > 0) {
  const hubspotContactId = ticket.associations.contacts.results[0].id;
  const user = await prisma.user.findUnique({
    where: { hubspotId: hubspotContactId },
  });
  // Use this user as the ticket creator
}
```

## Benefits

### For Support Teams

1. **Know who submitted the ticket**
   - Full contact name and details
   - Direct link to contact in HubSpot
   - View contact's communication history

2. **Better customer context**
   - See all tickets from a specific contact
   - Understand customer relationships
   - Track support needs by person, not just company

3. **Seamless communication**
   - Email the right person about updates
   - Reference past conversations
   - Maintain relationship continuity

### For Customers

1. **Personalized support**
   - Tickets are associated with them personally
   - Support team knows their history
   - Faster resolution with context

2. **Easy tracking**
   - See their own tickets
   - Track their requests
   - Follow up on specific issues

## API Endpoints

### Sync Contacts

```
POST /api/hubspot/sync-contacts
```

**Response:**
```json
{
  "success": true,
  "synced": 5,
  "updated": 3,
  "skipped": 2,
  "errors": 0,
  "details": {
    "synced": [
      {
        "id": "12345",
        "name": "John Doe",
        "email": "john@example.com",
        "company": "abc123"
      }
    ],
    "updated": [...],
    "skipped": [...],
    "errors": []
  }
}
```

### Create Ticket with Contact Association

```
POST /api/tickets
```

**Request Body:**
```json
{
  "companyId": "abc123",
  "siteId": "xyz789",
  "subject": "Machine Down",
  "description": "Inserter stopped working",
  "priority": "high",
  "createdById": "user123"  // User with hubspotId
}
```

The system automatically associates the ticket with the user's HubSpot contact.

## Troubleshooting

### Contacts Not Syncing

**Problem**: Contacts aren't appearing after sync

**Solutions**:
1. ✅ Check that companies are synced first
2. ✅ Verify contacts are associated with companies in HubSpot
3. ✅ Ensure contacts have email addresses
4. ✅ Check `HUBSPOT_API_KEY` has permissions for Contacts API

### Tickets Not Associating with Contacts

**Problem**: Tickets in HubSpot don't show contact associations

**Solutions**:
1. ✅ Sync contacts before creating tickets
2. ✅ Ensure the ticket creator is a synced user (has `hubspotId`)
3. ✅ Check HubSpot API permissions include ticket associations
4. ✅ Verify contact exists in HubSpot

### Duplicate Users Created

**Problem**: Same person has multiple user accounts

**Solution**:
- The system checks both `hubspotId` and `email` to prevent duplicates
- If duplicates exist, they were created before syncing
- You can manually merge them or delete duplicates

### Contact Links Not Working

**Problem**: HubSpot icon appears but link doesn't work

**Solutions**:
1. ✅ Verify you're logged into HubSpot
2. ✅ Check you have access to the Contacts section
3. ✅ Confirm the `hubspotId` is valid
4. ✅ Try logging into HubSpot in another tab first

## Best Practices

### Sync Workflow

1. **Initial Setup:**
   ```
   1. Sync Companies from HubSpot
   2. Sync Contacts from HubSpot
   3. Sync Tickets from HubSpot
   ```

2. **Regular Maintenance:**
   - Sync contacts weekly or when onboarding new customers
   - Re-sync if contacts are updated in HubSpot
   - Keep companies synced to ensure contact associations work

### User Management

1. **For New Customers:**
   - Add company in HubSpot with service plan
   - Add contact in HubSpot associated with company
   - Sync contacts in the app
   - User is automatically created

2. **For Existing Users:**
   - If they have an email match, they'll be linked to HubSpot
   - If not, create contact in HubSpot with matching email
   - Re-sync to link them

3. **For Internal Users:**
   - Service techs and admins don't need HubSpot contacts
   - They can create tickets without contact associations
   - Tickets will still sync to HubSpot (just without contact link)

## Technical Details

### HubSpot API Calls

**Fetching Contacts:**
```typescript
client.crm.contacts.basicApi.getPage(
  100,  // Limit
  undefined,  // After (for pagination)
  ["firstname", "lastname", "email", "phone", "jobtitle"],  // Properties
  undefined,  // Associations types
  ["companies"]  // Associated objects
);
```

**Creating Contact:**
```typescript
client.crm.contacts.basicApi.create({
  properties: {
    email: "john@example.com",
    firstname: "John",
    lastname: "Doe"
  },
  associations: [
    {
      to: { id: companyId },
      types: [{ 
        associationCategory: "HUBSPOT_DEFINED", 
        associationTypeId: 1  // Company-to-Contact association
      }]
    }
  ]
});
```

### Database Queries

**Find User by HubSpot ID:**
```typescript
const user = await prisma.user.findUnique({
  where: { hubspotId: "12345" }
});
```

**Find Contact Association for Ticket:**
```typescript
const creator = await prisma.user.findUnique({
  where: { id: createdById },
  select: { hubspotId: true }
});
```

## Future Enhancements

Potential improvements:

- [ ] Two-way contact sync (update HubSpot when users change)
- [ ] Sync contact properties (phone, job title, etc.)
- [ ] Multiple contact associations per ticket
- [ ] Contact activity timeline in user profile
- [ ] Automatic password reset email for new users
- [ ] Contact segmentation by company/role
- [ ] Bulk contact operations
- [ ] Contact import/export tools

---

For more information about HubSpot setup, see:
- [HUBSPOT_SETUP.md](./HUBSPOT_SETUP.md) - Initial API setup
- [HUBSPOT_TICKETS.md](./HUBSPOT_TICKETS.md) - Ticket integration
- [HUBSPOT_BEST_PRACTICES.md](./HUBSPOT_BEST_PRACTICES.md) - Integration strategy

**You're now maximizing HubSpot's contact management with complete ticket-to-person tracking!** 🎉

