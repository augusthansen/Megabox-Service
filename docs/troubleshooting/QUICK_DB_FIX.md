# 🔧 Quick Database Connection Fix

## The Problem
Your Supabase database connection is failing. This usually means the database is **paused** (Supabase free tier auto-pauses after inactivity).

## ✅ Quick Fix (2 Steps)

### Step 1: Wake Up Your Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (`duzsuwbfmqrbjbwpomjn`)
3. **Look for a "Resume" or "Restore" button** - click it
4. OR open the **Table Editor** or **SQL Editor** - this will wake up the database
5. Wait 30-60 seconds for it to activate

### Step 2: Test the Connection

After waking up the database, test it:

```bash
cd "/Users/augusthansen/Documents/Programs/Megabox Service App/megabox-service"
npx tsx scripts/test-db-connection.ts
```

If it works, you'll see:
```
✅ Database connection successful!
✅ Found X companies in database
```

### Step 3: Restart Your Dev Server

After the database is active:

```bash
# Stop your dev server (Ctrl+C if it's running)
# Then restart:
npm run dev
```

## 🔍 If That Doesn't Work

### Option A: Try Direct Connection String

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Find **"Connection string"** → **"Direct connection"**
3. Copy the connection string (it should look like):
   ```
   postgresql://postgres:[PASSWORD]@db.duzsuwbfmqrbjbwpomjn.supabase.co:5432/postgres
   ```
4. Update your `.env.local` file with this connection string
5. Restart your dev server

### Option B: Check IP Restrictions

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Look for **"Network restrictions"** or **"IP allowlist"**
3. Make sure your IP is allowed (or temporarily allow all IPs for development)

## 💡 Most Common Solution

**99% of the time, the database just needs to be woken up:**

1. Open Supabase Dashboard
2. Click **"Table Editor"** or **"SQL Editor"**
3. Wait 30 seconds
4. Try connecting again

That's usually all it takes!

