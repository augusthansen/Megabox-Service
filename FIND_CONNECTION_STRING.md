# 🔍 How to Find Your Supabase Connection String

## Step-by-Step Instructions

### Step 1: Log into Supabase
1. Go to **https://supabase.com**
2. Click **"Sign In"** (top right)
3. Log in with your account

### Step 2: Open Your Project
1. You should see a list of your projects (or just one if you only have one)
2. **Click on your project** to open it
3. Wait for the dashboard to load

### Step 3: Go to Settings
1. Look at the **left sidebar** - you'll see icons like:
   - 🏠 Home
   - 📊 Table Editor
   - 🔐 Authentication
   - ⚙️ **Settings** ← Click this one!
2. Click the **⚙️ Settings** icon (it's usually at the bottom of the sidebar)

### Step 4: Open Database Settings
1. In the Settings page, you'll see a menu on the left with:
   - General
   - API
   - **Database** ← Click this!
   - Auth
   - Storage
   - etc.
2. Click **"Database"** in that left menu

### Step 5: Find Connection String
1. Scroll down the Database settings page
2. Look for a section called **"Connection string"** or **"Connection pooling"**
3. You'll see tabs like: **"URI"**, **"JDBC"**, **"Golang"**, etc.
4. **Click the "URI" tab** (this is the one we need!)

### Step 6: Copy the Connection String
1. You'll see a connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
2. There should be a **copy button** (📋 icon) next to it
3. **Click the copy button** to copy it

---

## 🎯 Visual Guide (What to Look For)

**In the Database settings page, you should see:**

```
┌─────────────────────────────────────┐
│ Connection string                  │
├─────────────────────────────────────┤
│ [URI] [JDBC] [Golang] [Python]     │ ← Click "URI" tab
├─────────────────────────────────────┤
│ postgresql://postgres:...          │
│ [📋 Copy]                          │ ← Click this to copy
└─────────────────────────────────────┘
```

---

## 🔑 Important Notes

1. **The connection string has `[YOUR-PASSWORD]` as a placeholder**
   - This is your **database password**, not your Supabase account password
   - If you don't know it, you can reset it in the same settings page

2. **If you see `[YOUR-PASSWORD]` in the string:**
   - You need to replace it with your actual database password
   - Or click "Reset database password" to set a new one

3. **The connection string format:**
   ```
   postgresql://postgres:PASSWORD@db.PROJECT-ID.supabase.co:5432/postgres
   ```

---

## 🆘 Still Can't Find It?

**Alternative Method:**

1. In Supabase, go to **Settings** → **Database**
2. Look for **"Connection info"** or **"Connection parameters"**
3. You might see separate fields for:
   - Host
   - Database name
   - Port
   - User
   - Password
4. If you see these, the connection string format is:
   ```
   postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
   ```

---

## 💡 Quick Check

**Are you:**
- ✅ Logged into Supabase?
- ✅ In your project dashboard?
- ✅ Clicked Settings (⚙️ icon)?
- ✅ Clicked "Database" in the settings menu?
- ✅ Scrolled down to see "Connection string"?

If you've done all these and still can't find it, let me know what you see on the Database settings page!


