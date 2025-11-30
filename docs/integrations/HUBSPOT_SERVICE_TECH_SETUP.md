# HubSpot Service Tech Setup Guide

This guide explains how to set up service tech users in HubSpot so they automatically get the correct role when synced to the app.

## ⚠️ Important: Contacts vs Users

**HubSpot Contacts** = CRM records (people in your database)  
**HubSpot Users** = Team members with login access (require seats/licenses)

**For service techs to log into HubSpot mobile app, they need to be HubSpot Users (not just Contacts).**

See `HUBSPOT_USER_SETUP.md` for detailed instructions on creating HubSpot Users with Service Hub Seats.

## Overview

When you add a service tech in HubSpot and sync contacts, they will automatically be created in the app with the `service_tech` role and appropriate permissions.

**However, to log into HubSpot mobile app, you must also create them as a HubSpot User with a Service Hub Seat.**

## Setup Methods

You can identify service techs in HubSpot using one of three methods (in priority order):

### Method 1: Contact Type Property (Recommended - Already Set Up) ✅

If you have a **Contact Type** dropdown property in HubSpot, you can use it to identify service techs.

**How it works:**
- Set **Contact Type** to **"Technician"** (or "Tech") for service tech contacts
- The app will automatically detect this and assign the `service_tech` role
- Case-insensitive matching (e.g., "Technician", "technician", "TECHNICIAN" all work)

**No additional setup needed if you already have this property!** Just make sure service tech contacts have "Technician" selected.

### Method 2: Custom Property `is_service_tech`

This is a boolean/checkbox property that marks a contact as a service tech.

#### Step 1: Create the Custom Property in HubSpot

1. Go to **HubSpot Settings** → **Properties** → **Contact properties**
2. Click **Create property**
3. Configure the property:
   - **Label**: `Is Service Tech`
   - **Internal name**: `is_service_tech`
   - **Field type**: **Checkbox** or **Single-line text**
   - **Group**: Contact information (or create a custom group)
4. Click **Create**

#### Step 2: Mark Service Techs in HubSpot

1. Go to **Contacts** → Select a contact
2. Scroll to the **Is Service Tech** property
3. Check the box (or set to "true" if using text field)
4. Save the contact

#### Step 3: Sync Contacts

1. In the app, go to **Admin → Users**
2. Click **"Sync from HubSpot"**
3. Service techs will be created with `service_tech` role automatically

### Method 3: Custom Property `user_role` (Alternative)

This allows you to set any role directly in HubSpot.

#### Step 1: Create the Custom Property

1. Go to **HubSpot Settings** → **Properties** → **Contact properties**
2. Click **Create property**
3. Configure the property:
   - **Label**: `User Role`
   - **Internal name**: `user_role`
   - **Field type**: **Single-line text** or **Dropdown**
   - **Group**: Contact information
4. If using dropdown, add options:
   - `service_tech`
   - `customer_admin`
   - `customer_tech`
   - `super_admin`
5. Click **Create**

#### Step 2: Set Role in HubSpot

1. Go to **Contacts** → Select a contact
2. Set **User Role** to `service_tech` (or other role)
3. Save the contact

#### Step 3: Sync Contacts

1. In the app, go to **Admin → Users**
2. Click **"Sync from HubSpot"**
3. Users will be created with the role specified in HubSpot

## How It Works

### Role Detection Logic

When syncing contacts, the app checks in this priority order:

1. **First**: `contact_type` property (your existing "Contact Type" dropdown)
   - If set to "Technician" or "Tech" → Role = `service_tech`
   - Case-insensitive matching

2. **Second**: `is_service_tech` property (checkbox or "true" text)
   - If true → Role = `service_tech`

3. **Third**: `user_role` property
   - If set to a valid role → Use that role
   - Valid roles: `service_tech`, `customer_admin`, `customer_tech`, `super_admin`

4. **Default**: If none of the above are set
   - Role = `customer_admin` (for customer contacts)

### Service Tech vs Customer Roles

**Service Techs:**
- ✅ Don't require company association
- ✅ Can be synced without a company
- ✅ Get `service_tech` role automatically
- ✅ Can log into HubSpot mobile app for chat notifications

**Customer Roles:**
- ❌ Require company association
- ❌ Must be linked to a synced company
- ✅ Get `customer_admin` or `customer_tech` role
- ✅ Associated with their company

## Example Workflow

### Adding a New Service Tech

1. **In HubSpot:**
   - Create a new contact (or edit existing)
   - Set email, first name, last name
   - Set **Contact Type** dropdown to **"Technician"** ✅ (or use `is_service_tech` checkbox)
   - Save contact

2. **In the App:**
   - Go to **Admin → Users**
   - Click **"Sync from HubSpot"**
   - New service tech user is created with:
     - Email from HubSpot
     - Name from HubSpot
     - Role: `service_tech`
     - Random password (they'll need to reset it)
     - Active status

3. **Service Tech Setup:**
   - Tech receives login credentials (email + reset password link)
   - Tech logs into app with `service_tech` role
   - Tech downloads HubSpot mobile app
   - Tech logs into HubSpot mobile app with same email
   - Tech receives chat notifications for assigned tickets

## Updating Existing Users

If you update a contact's role in HubSpot:

1. Change the `is_service_tech` or `user_role` property in HubSpot
2. Sync contacts again in the app
3. The user's role will be updated automatically

## Troubleshooting

### Service Tech Not Getting Correct Role

**Check:**
1. Is the **Contact Type** set to "Technician" or "Tech"? (Case-insensitive)
2. Is the `is_service_tech` property set to "true" or checked?
3. Is the `user_role` property set correctly?
4. Did you sync contacts after making the change?
5. Check the sync results for any errors or skipped contacts

### Service Tech Requires Company

**Issue**: Service tech sync is being skipped because they need a company.

**Solution**: Service techs don't require a company. Make sure:
- `is_service_tech` is set to "true" OR
- `user_role` is set to "service_tech"

The sync logic will skip the company requirement for service techs.

### Contact Not Syncing

**Possible reasons:**
1. No email address
2. For customer roles: Not associated with a synced company
3. HubSpot API key not configured
4. Contact already exists with different email

## Best Practices

1. **Use Contact Type (if you already have it)** ✅ **Recommended**
   - You already have this set up!
   - Just set Contact Type to "Technician" for service techs
   - No additional properties needed

2. **Use `is_service_tech` for simplicity** (if you don't have Contact Type)
   - Easy checkbox to mark service techs
   - Clear and obvious

3. **Use `user_role` for flexibility** (if you need multiple roles)
   - Can set any role directly
   - Useful if you have multiple internal roles

4. **Keep HubSpot as source of truth**
   - Update Contact Type in HubSpot
   - Sync to app regularly
   - App will update automatically

5. **Document your process**
   - Create a checklist for adding new service techs
   - Include HubSpot setup steps
   - Include app sync steps

## API Details

The sync process:
1. Fetches contacts from HubSpot with `contact_type`, `is_service_tech`, and `user_role` properties
2. Checks if contact is a service tech (priority: Contact Type → is_service_tech → user_role)
3. Determines role based on properties
4. Creates/updates user in app with correct role
5. Service techs don't require company association
6. Customer roles require company association

## Next Steps

After setting up service techs:
1. ✅ **Create HubSpot User** with Service Hub Seat (see `HUBSPOT_USER_SETUP.md`)
2. ✅ Verify they can log into the app
3. ✅ Verify they can log into HubSpot mobile app
4. ✅ Test chat notification flow
5. ✅ Verify they only see assigned tickets in app
6. ✅ Document the process for your team

## Related Documentation

- **`HUBSPOT_USER_SETUP.md`** - How to create HubSpot Users (team members) with seats
- This guide covers Contact sync and role assignment
- Both are needed for complete service tech setup

