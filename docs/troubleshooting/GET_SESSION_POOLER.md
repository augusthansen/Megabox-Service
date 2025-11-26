# 🔗 Get Session Pooler Connection String

I can see the connection modal! The direct connection shows an IPv4 warning. We need the **Session Pooler** instead.

## What to Do:

### Option 1: Change the Method Dropdown
1. In the connection modal, look at the **"Method"** dropdown
2. Change it from **"Direct connection"** to **"Session Pooler"** (or "Transaction Pooler")
3. The connection string below should update automatically
4. Copy that new connection string

### Option 2: Click Pooler Settings
1. Click the **"Pooler settings"** button (shown in the warning)
2. This should show you the pooler connection string
3. Copy that connection string

---

## What the Session Pooler String Looks Like:

It should be similar to:
```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
```

Or:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres
```

Notice:
- Uses `pooler.supabase.com` (not `db.`)
- Username format: `postgres.[PROJECT-REF]` (with a dot)
- Port is still 5432 for Session mode

---

## 🎯 Next Steps:

1. **Change the Method dropdown to "Session Pooler"**
2. **Copy the connection string that appears**
3. **Share it with me** (you can replace the password with [YOUR_PASSWORD] if you prefer)

Then I'll update your `.env` file with the correct connection string!


