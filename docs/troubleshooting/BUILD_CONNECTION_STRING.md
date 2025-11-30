# 🔧 Building Your Connection String

## What You Have

- ✅ Project ID (you found this!)

## What We Need

- 🔑 Database Password

---

## Step 1: Find Your Database Password

In the same Database settings page where you see the Project ID, look for:

### Option A: Password Field

- You might see a field labeled **"Database password"** or **"Postgres password"**
- It might be hidden with dots (••••••••)
- There might be a **"Show"** or **"Reveal"** button

### Option B: Reset Password

If you don't see the password or don't remember it:

1. Look for a button that says:

   - **"Reset database password"**
   - **"Generate new password"**
   - **"Change password"**

2. Click it to set a new password
3. **Copy the password immediately** (Supabase usually shows it once)
4. Save it somewhere safe!

---

## Step 2: Find Your Project Reference

The connection string uses a **Project Reference**, not the Project ID.

Look for:

- **"Reference ID"** or **"Project Reference"**
- It's usually shorter than the Project ID
- Format: `abcdefghijklmnop` (letters and numbers, no dashes)

**OR** it might be the same as your Project ID.

---

## Step 3: Build the Connection String

Once you have:

- Project Reference (or Project ID)
- Database Password

The format is:

```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Example:**
If your:

- Project Reference: `abcdefghijklmnop`
- Password: `MySecurePassword123`

Then your connection string would be:

```
postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

---

## 🎯 What to Tell Me

Please share:

1. **Project ID** (you already have this!)
2. **Project Reference** (if you see it, or we'll use Project ID)
3. **Database Password** (or tell me if you need to reset it)

Then I'll build the connection string for you and add it to your `.env.local` file!

---

## 💡 Quick Tip

If you reset the password, Supabase will show it to you **once**. Make sure to copy it immediately!
