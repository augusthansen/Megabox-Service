# Daily.co Video Call Setup

This guide will help you set up Daily.co for video calls in the app.

## Step 1: Create a Daily.co Account

1. Go to [https://www.daily.co/](https://www.daily.co/)
2. Sign up for a free account (or use an existing account)
3. Complete the account setup

## Step 2: Get Your API Key

1. Log in to your Daily.co dashboard
2. Go to **Developers** → **API Keys** (or **Settings** → **API Keys**)
3. Click **Create API Key**
4. Give it a name (e.g., "Megabox Service App")
5. Copy the API key (you'll only see it once!)

## Step 3: Add API Key to Environment Variables

1. Open your `.env.local` file in the project root
2. Add or update the `DAILY_API_KEY` line:
   ```
   DAILY_API_KEY="your-api-key-here"
   ```
3. Replace `your-api-key-here` with the API key you copied from Daily.co
4. Save the file

## Step 4: Restart Your Dev Server

1. Stop your dev server (Ctrl+C)
2. Start it again: `npm run dev`

## Step 5: Test Video Calls

1. Log in to the admin portal
2. Open a ticket
3. Click the **"Video Call"** button
4. The video call should open in a modal
5. Allow camera/microphone permissions when prompted

## Troubleshooting

### "Daily.co API key is not configured"
- Make sure `DAILY_API_KEY` is set in `.env.local`
- Restart your dev server after adding the key
- Check that there are no extra spaces or quotes around the key

### Video call doesn't load
- Check browser console for errors (F12 → Console)
- Make sure camera/microphone permissions are allowed
- Try a different browser (Chrome/Firefox work best)
- Check that your Daily.co account is active

### "Failed to create Daily.co room"
- Verify your API key is correct
- Check your Daily.co account limits (free tier has limits)
- Check the terminal/console for detailed error messages

## Daily.co Free Tier Limits

- 10,000 minutes per month
- Up to 10 participants per call
- Cloud recording available
- Screen sharing enabled

For production use, consider upgrading to a paid plan.

## Additional Resources

- [Daily.co Documentation](https://docs.daily.co/)
- [Daily.co API Reference](https://docs.daily.co/reference/rest-api)
- [Daily.co Prebuilt UI](https://docs.daily.co/reference/prebuilt-ui)

