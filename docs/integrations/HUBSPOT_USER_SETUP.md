# HubSpot User Setup for Service Techs

## Important: Contacts vs Users

**HubSpot Contacts** = CRM records (people in your database)  
**HubSpot Users** = Team members with login access (require seats/licenses)

For service techs to log into the HubSpot mobile app, they need to be **HubSpot Users**, not just Contacts.

## Seat Type Required

For service techs who need to:
- Log into HubSpot mobile app
- Receive chat notifications
- Respond to customer chats
- Manage tickets

**You need: Service Hub Seat** ✅

This provides access to:
- Service Hub features
- Chat/conversations
- Ticket management
- Mobile app access

## How to Create HubSpot Users for Service Techs

### Option 1: Manual Setup in HubSpot (Recommended)

**Step 1: Create the User in HubSpot**

1. Go to **HubSpot Settings** → **Users & Teams** → **Users**
2. Click **"Create user"** or **"Invite user"**
3. Enter the service tech's email address
4. Select **"Service Hub Seat"** as the seat type
5. Set permissions:
   - **Service Hub**: Full access (or customize as needed)
   - **Chat**: Access to conversations
   - **Tickets**: View and manage tickets
6. Click **"Send invitation"** or **"Create user"**

**Step 2: Link Contact to User (Optional but Recommended)**

1. Go to **Contacts** → Find the service tech contact
2. Make sure the contact has the same email as the HubSpot user
3. HubSpot will automatically link them if emails match

**Step 3: Verify in Your App**

1. In your app, go to **Admin → Users**
2. Create the service tech user (or sync from HubSpot if they're a contact)
3. The user should be able to:
   - Log into your app with `service_tech` role
   - Log into HubSpot mobile app with the same email
   - Receive chat notifications

### Option 2: Create User in App First, Then Add to HubSpot

**Step 1: Create Service Tech in Your App**

1. Go to **Admin → Users** → **Create User**
2. Fill in:
   - Name
   - Email (use the email they'll use for HubSpot)
   - Role: **Service Tech**
   - Password
3. Click **Create**

**Step 2: Add as HubSpot User**

1. Go to **HubSpot Settings** → **Users & Teams** → **Users**
2. Click **"Create user"** or **"Invite user"**
3. Enter the **same email** used in your app
4. Select **"Service Hub Seat"**
5. Set appropriate permissions
6. Send invitation

**Step 3: Verify**

- Service tech can log into your app
- Service tech can log into HubSpot mobile app (after accepting invitation)
- Chat notifications will work

## Seat Types Explained

### Service Hub Seat ✅ (Recommended for Service Techs)

**What it includes:**
- Full access to Service Hub features
- Chat/conversations access
- Ticket management
- Mobile app access
- Customer communication tools

**Cost:** Varies by HubSpot plan (check your subscription)

**Best for:** Service techs who need to respond to chats and manage tickets

### Core Seat

**What it includes:**
- Basic access to all Hubs
- Limited Service Hub features
- May not include advanced chat features

**Best for:** General team members who need basic access

### View-Only Seat

**What it includes:**
- Can view data but not edit
- No chat access
- No ticket management

**Best for:** Managers who only need to view reports

## Permissions to Set

For service techs, recommend these permissions:

### Service Hub Permissions
- ✅ **Tickets**: View and manage tickets
- ✅ **Conversations**: Access to chat/conversations
- ✅ **Knowledge Base**: View articles (optional)
- ✅ **Customer Feedback**: View surveys (optional)

### General Permissions
- ✅ **Contacts**: View contacts (for context)
- ✅ **Companies**: View companies (for context)
- ❌ **Deals**: Not needed for service techs
- ❌ **Marketing**: Not needed for service techs

## Workflow Summary

### Complete Setup Process

1. **In HubSpot:**
   - Create HubSpot User with Service Hub Seat
   - Set Contact Type = "Technician" (if using Contact Type property)
   - Ensure contact and user have matching email

2. **In Your App:**
   - Create service tech user (or sync from HubSpot)
   - User gets `service_tech` role automatically
   - User can log into app

3. **Service Tech Setup:**
   - Tech accepts HubSpot invitation (if sent)
   - Tech downloads HubSpot mobile app
   - Tech logs into HubSpot mobile app with same email
   - Tech receives chat notifications for assigned tickets
   - Tech responds to chats in HubSpot mobile app
   - Tech manages tickets in your custom app

## Troubleshooting

### Service Tech Can't Log into HubSpot Mobile App

**Check:**
1. ✅ Is the user created in HubSpot Settings → Users (not just Contacts)?
2. ✅ Do they have a Service Hub Seat assigned?
3. ✅ Did they accept the invitation email?
4. ✅ Are they using the correct email address?
5. ✅ Is the email the same in both HubSpot and your app?

### Service Tech Not Receiving Chat Notifications

**Check:**
1. ✅ Do they have a Service Hub Seat?
2. ✅ Are conversations/chat permissions enabled?
3. ✅ Are they assigned to tickets in your app?
4. ✅ Is ticket assignment syncing to HubSpot?
5. ✅ Check HubSpot mobile app notification settings

### Service Tech Can't See Tickets in HubSpot

**Check:**
1. ✅ Do they have ticket permissions in HubSpot?
2. ✅ Are tickets syncing from your app to HubSpot?
3. ✅ Are they assigned to the tickets?
4. ✅ Check HubSpot user permissions

## API Limitations

**Note:** The HubSpot API has limited support for creating Users (team members). Creating users typically requires:
- Admin access to HubSpot
- Manual creation through HubSpot UI
- Or using HubSpot's User API (if available on your plan)

**Current Implementation:**
- ✅ We create HubSpot **Contacts** (CRM records) via API
- ❌ We cannot create HubSpot **Users** (team members) via API automatically
- ✅ You need to manually create HubSpot Users in HubSpot Settings

## Best Practices

1. **Use Same Email Everywhere**
   - HubSpot User email = App user email = Contact email
   - Ensures proper linking and access

2. **Create Users Before Contacts**
   - Create HubSpot User first
   - Then create/sync Contact (will auto-link if emails match)

3. **Document Your Process**
   - Create a checklist for onboarding new service techs
   - Include HubSpot user creation steps
   - Include app user creation steps

4. **Monitor Seat Usage**
   - Track how many Service Hub Seats you're using
   - Plan for growth
   - Consider seat costs in budget

## Cost Considerations

**Service Hub Seats:**
- Each service tech needs a Service Hub Seat
- Seats are typically billed monthly
- Check your HubSpot plan for exact pricing
- Consider if you need seats for all techs or just active ones

**Alternative:**
- Some plans allow "View-Only" seats for monitoring
- But service techs need full Service Hub Seats for chat access

## Next Steps

1. ✅ Create HubSpot Users for your service techs (Service Hub Seat)
2. ✅ Create service tech users in your app (or sync from HubSpot)
3. ✅ Verify techs can log into both systems
4. ✅ Test chat notification flow
5. ✅ Document your onboarding process

