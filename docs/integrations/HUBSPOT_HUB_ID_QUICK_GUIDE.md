# Quick Guide: Finding Your HubSpot Hub ID

## The Easiest Way (Recommended)

1. **Go to HubSpot** → Log into your account
2. **Settings** (gear icon in top right)
3. **Conversations** → **Chatflows**
4. **Create a chatflow** (if you don't have one):
   - Click "Create chatflow"
   - Choose "Website chat" or "Live chat"
   - Name it (e.g., "Customer Support")
   - Click through the setup (you can configure details later)
   - Click "Finish"
5. **Click on your chatflow** to open it
6. **Look for "Installation" or "Embed" tab/section**
7. **Find the script code** - it will look like this:
   ```html
   <script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/12345678.js"></script>
   ```
8. **The number `12345678` is your Hub ID!**

## Alternative: Check Your Browser URL

While logged into HubSpot, look at your browser's address bar. The URL will contain your Hub ID:

- `app.hubspot.com/contacts/12345678/...`
- `app.hubspot.com/reports/12345678/...`
- `app.hubspot.com/12345678/...`

The number in the URL path is your Hub ID.

## What to Do With It

Once you have your Hub ID:

1. Open your `.env.local` file
2. Add this line:
   ```
   NEXT_PUBLIC_HUBSPOT_HUB_ID="12345678"
   ```
   (Replace `12345678` with your actual Hub ID)
3. Save the file
4. Restart your dev server (`npm run dev`)

The chat widget will then appear in your customer portal!

