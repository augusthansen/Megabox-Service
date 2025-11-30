# 🔗 Get Supavisor Connection String

According to Supabase's Prisma docs, we need the **Supavisor Session pooler string**.

## How to Get It:

1. **Go to your Supabase project dashboard** (main page)
2. **Look for a "Connect" button** - usually near the top or in a sidebar
3. **Click "Connect"** - this shows connection options
4. **Find "Supavisor Session pooler"** - it should show a connection string
5. **The connection string should end with `:5432`** (not 6543)

## What It Should Look Like:

```
postgres://[DB-USER].[PROJECT-REF]:[PASSWORD]@[DB-REGION].pooler.supabase.com:5432/postgres
```

## Alternative: Check Connection Info

If you don't see a "Connect" button:

- Look for **"Connection info"** or **"Database connection"** in the dashboard
- Or check if there's a connection string shown on the main project page

---

## 🎯 What to Do:

1. **Go to your project dashboard/home page** (not Settings)
2. **Look for a "Connect" button or connection info**
3. **Find the Supavisor Session pooler string** (ends with :5432)
4. **Copy it and share it with me**

This is the connection string we need for Prisma!
