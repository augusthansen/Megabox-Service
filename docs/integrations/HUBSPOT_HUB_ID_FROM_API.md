# Finding Hub ID When HubSpot Says "Embed Using API"

If HubSpot is showing you "Embed using API" instructions, here's how to find your Hub ID:

## Method 1: From the API Instructions Page

When HubSpot shows "Embed using API":

1. **Look for the code snippet** - Even if it says "API", HubSpot usually shows example code
2. **Find the script URL** - It will look like:
   ```
   https://js.hs-scripts.com/12345678.js
   ```
   The number `12345678` is your Hub ID

3. **Or look for "Hub ID" or "Account ID"** - It's often displayed near the API instructions

## Method 2: From Your Account Dropdown

1. Click on your **account name** in the top right corner of HubSpot
2. Your **Hub ID** is usually displayed in the dropdown menu
3. It's a number like `12345678`

## Method 3: From Chatflow Settings

1. Go to **Settings** → **Conversations** → **Chatflows**
2. Click on your chatflow
3. Go to **Installation** or **Target** tab
4. Even if it says "API", look for:
   - Any URL containing `js.hs-scripts.com`
   - "Hub ID" or "Account ID" field
   - Example code snippets

## Method 4: From Your HubSpot URL

While logged into HubSpot, check your browser's address bar:

- `app.hubspot.com/contacts/12345678/...`
- `app.hubspot.com/reports/12345678/...`

The number in the URL is your Hub ID.

## Method 5: Contact HubSpot Support

If you still can't find it:
1. Contact HubSpot support
2. Ask them for your Hub ID
3. They can provide it immediately

## Once You Have It

Add it to your `.env.local` file:

```
NEXT_PUBLIC_HUBSPOT_HUB_ID="12345678"
```

(Replace `12345678` with your actual Hub ID)

Then restart your dev server. The chat widget will load automatically using the Conversations API!

