# HubSpot Custom Properties Setup

To enable filtered syncing (only companies with service plans), you need to set up custom properties in HubSpot.

## Required Custom Properties

### 1. Has Service Plan (Company Property)

**Property Details:**
- **Internal Name:** `has_service_plan`
- **Label:** "Has Service Plan"
- **Field Type:** Single checkbox
- **Description:** "Indicates this company has an active service plan"

**How to Create:**

1. Go to HubSpot → **Settings** (gear icon)
2. Navigate to **Data Management** → **Properties**
3. Click **Create property**
4. Select **Company properties**
5. Fill in:
   - **Label:** Has Service Plan
   - **Internal name:** has_service_plan
   - **Field type:** Single checkbox
   - **Description:** Indicates this company has an active service plan
6. Click **Create**

### 2. Service Plan Tier (Company Property) - Optional

**Property Details:**
- **Internal Name:** `service_plan_tier`
- **Label:** "Service Plan Tier"
- **Field Type:** Dropdown select
- **Options:**
  - Basic
  - Standard
  - Mega
- **Description:** "The service plan tier for this company"

**How to Create:**

1. Go to HubSpot → **Settings** → **Data Management** → **Properties**
2. Click **Create property** → **Company properties**
3. Fill in:
   - **Label:** Service Plan Tier
   - **Internal name:** service_plan_tier
   - **Field type:** Dropdown select
   - **Options:** Add "Basic", "Standard", "Mega"
   - **Description:** The service plan tier for this company
4. Click **Create**

## How to Mark Companies for Sync

### Option 1: Bulk Update
1. Go to **Contacts** → **Companies**
2. Select the companies you want to sync
3. Click **Edit** → Select "Has Service Plan"
4. Check the box
5. Optionally set the "Service Plan Tier"

### Option 2: Individual Company
1. Open a company record
2. Find the "Has Service Plan" property
3. Check the box
4. Optionally set the "Service Plan Tier"
5. Save

## Testing the Filter

After setting up the properties and marking some companies:

1. Mark 2-3 test companies with "Has Service Plan" = checked
2. In your app, go to **Customers** page
3. Click **"🔄 Sync from HubSpot"**
4. You should see only the companies with service plans synced

## Troubleshooting

### Error: "Property 'has_service_plan' does not exist"

This means the custom property hasn't been created in HubSpot yet. Follow the steps above to create it.

### No companies are syncing

- Check that at least one company has "Has Service Plan" checked in HubSpot
- Verify the property internal name is exactly `has_service_plan` (no spaces, all lowercase)
- Make sure your HubSpot Private App has access to read company properties

### Want to sync ALL companies (no filter)

If you want to temporarily sync all companies without the filter, you can modify the sync API call. Let me know and I can show you how!

