# 🔄 Try Connection Pooling

Since the SQL Editor works, the database is active! The issue is likely that we need to use **connection pooling** for external connections.

## What to Look For:

In the **"Connection pooling configuration"** section you saw earlier:

1. Look for a **"Connection string"** or **"Connect"** button
2. Or check if there's a way to view the pooling connection string
3. The pooling connection usually uses:
   - Port **6543** instead of 5432
   - A different hostname format
   - Often includes `pooler.supabase.com` in the URL

## Alternative: Check Connection Info

Sometimes Supabase shows connection info when you:

- Click on the **"Connection pooling configuration"** section header
- Or look for a **"Show connection string"** link
- Or check the **"Docs"** button next to it

---

## 🎯 What I Need:

Can you:

1. Go back to **Settings → Database**
2. Look at the **"Connection pooling configuration"** section
3. See if there's a connection string shown there, or a way to view it?

The pooling connection string might look like:

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

Or it might be in a different format. Let me know what you see!
