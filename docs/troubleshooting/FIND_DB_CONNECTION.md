# 🔍 Finding Database Connection String

I can see your API settings! The database connection string is in a **different place**.

## Where to Find It:

### Step 1: Go to Database Settings

1. In the left sidebar, click **Settings** (⚙️)
2. Click **"Database"** (not API)
3. Scroll down the page

### Step 2: Look For:

- **"Connection string"** section
- **"Connection parameters"** section
- **"Connection info"** section
- Or tabs like: **"URI"**, **"JDBC"**, **"Golang"**, etc.

### Step 3: Click "URI" Tab

- You should see tabs for different connection formats
- Click the **"URI"** tab
- Copy the full connection string shown there

---

## 🎯 What to Look For:

In **Settings → Database**, scroll down and you should see something like:

```
┌─────────────────────────────────────┐
│ Connection string                  │
├─────────────────────────────────────┤
│ [URI] [JDBC] [Golang] [Python]     │ ← Click "URI"
├─────────────────────────────────────┤
│ postgresql://postgres:...          │
│ [📋 Copy]                          │
└─────────────────────────────────────┘
```

---

## 💡 If You Still Can't Find It:

The connection string might be in:

- **"Connection pooling"** section (different format)
- **"Direct connection"** section
- Or you might need to click a **"Show"** or **"Reveal"** button

---

**Can you go to Settings → Database and scroll down? What do you see there?**
