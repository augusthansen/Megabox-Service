# Fix Database Connection Issue

## The Problem
Your Supabase database connection is failing. This usually happens when:
1. **Database is paused** (Supabase free tier auto-pauses after inactivity)
2. **Network/IP restrictions**
3. **Connection string format issue**

## Quick Fix Steps

### Step 1: Activate Your Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. If you see a "Resume" or "Restore" button, click it
4. Wait for the database to activate (usually 1-2 minutes)

### Step 2: Verify Connection String

Your connection string should be in `.env.local`:

```bash
DATABASE_URL="postgresql://postgres.duzsuwbfmqrbjbwpomjn:Rmhc%2A153rmhc%2A153@aws-0-us-west-2.pooler.supabase.com:5432/postgres"
```

### Step 3: Try Direct Connection (If Pooler Fails)

If the pooler connection doesn't work, try the direct connection string from Supabase:

1. Go to Supabase Dashboard → Project Settings → Database
2. Find "Connection string" → "Direct connection"
3. Copy the connection string
4. Update `.env.local` with the direct connection string

### Step 4: Test Connection

After activating the database, test the connection:

```bash
cd "/Users/augusthansen/Documents/Programs/Megabox Service App/megabox-service"
npx tsx scripts/test-db-connection.ts
```

### Step 5: Restart Dev Server

After fixing the connection:

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Alternative: Use Direct Connection String

If the pooler keeps failing, you can use the direct connection:

1. In Supabase Dashboard → Settings → Database
2. Find "Connection string" → "Direct connection"
3. It should look like: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
4. Update `.env.local` with this connection string
5. Restart your dev server

## Check Database Status

To check if your database is active:
1. Go to Supabase Dashboard
2. Look at the project status
3. If it says "Paused" or shows a "Resume" button, click it

---

**Once the database is active, the customer detail page should work!**

