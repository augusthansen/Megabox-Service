# 🔧 Troubleshooting Database Connection

## Issue: Can't reach database server

This usually means one of these things:

### 1. IP Restrictions (Most Common)

Supabase might be blocking connections from your IP address.

**To fix:**
1. In Supabase, go to **Settings** → **Database**
2. Look for **"Network restrictions"** or **"Connection pooling"**
3. Find **"Allowed IP addresses"** or **"IP allowlist"**
4. Either:
   - Add your current IP address, OR
   - For development, you can temporarily allow **"0.0.0.0/0"** (all IPs) - **only for development!**

### 2. Get the Exact Connection String

Instead of building it manually, let's get it directly from Supabase:

1. Go to **Settings** → **Database**
2. Scroll to **"Connection string"**
3. Click the **"URI"** tab
4. **Copy the entire connection string** (it should already have the password filled in)
5. Share it with me and I'll update your files

### 3. Try Connection Pooling

Supabase has two connection methods:
- **Direct connection** (port 5432) - what we tried
- **Connection pooling** (port 6543) - sometimes more reliable

**To get the pooling connection string:**
1. In Database settings, look for **"Connection pooling"**
2. Copy that connection string instead
3. It uses port **6543** instead of 5432

---

## 🎯 What to Do Next

**Option 1: Check IP Restrictions (Try this first)**
1. Go to Supabase → Settings → Database
2. Look for IP restrictions/allowlist
3. Add your IP or allow all IPs for development
4. Tell me: "I've updated IP restrictions"

**Option 2: Get Exact Connection String**
1. Go to Settings → Database → Connection string → URI tab
2. Copy the full connection string
3. Tell me: "Here's my connection string: [paste it]"

**Option 3: Try Connection Pooling**
1. Look for "Connection pooling" in Database settings
2. Copy that connection string
3. Tell me: "Here's my pooling connection string: [paste it]"

---

## 💡 Quick Check

Can you see a section in Database settings about:
- "Network restrictions"?
- "IP allowlist"?
- "Connection pooling"?

Let me know what you find!


