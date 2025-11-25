# 🗄️ Database Setup Guide

## Step 1: Get Your Supabase Connection String

I've created your `.env.local` file! Now you need to add your Supabase database connection string.

### How to Get It:

1. **Go to [supabase.com](https://supabase.com)** and log in
2. **Open your project** (or create one if you don't have one yet)
3. **Click the gear icon (⚙️)** in the left sidebar → **Settings**
4. **Click "Database"** in the settings menu
5. **Scroll down** to find **"Connection string"**
6. **Click the "URI" tab** (not "JDBC" or "Golang")
7. **Copy the connection string** - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

### Important Notes:
- The connection string already has `[YOUR-PASSWORD]` as a placeholder
- You need to **replace `[YOUR-PASSWORD]`** with your actual database password
- If you don't know your password, you can reset it in Supabase settings

---

## Step 2: Update .env.local

1. **Open the file:** `.env.local` in your project folder
2. **Find this line:**
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"
   ```
3. **Replace it** with your actual connection string from Step 1
4. **Save the file**

---

## Step 3: Test the Connection

Once you've updated `.env.local`, I'll help you:
1. Push the database schema (create all tables)
2. Create the admin user
3. Verify everything works

---

## 🆘 Don't Have Supabase Yet?

**No problem!** Here's how to create a free account:

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up (free tier is perfect for development)
4. Create a new project
5. Wait ~2 minutes for it to set up
6. Then follow Step 1 above

**Free tier includes:**
- 500 MB database
- 2 GB bandwidth
- Perfect for development!

---

## ✅ What's Already Done

- ✅ `.env.local` file created
- ✅ `NEXTAUTH_SECRET` generated (secure random key)
- ✅ All other settings configured

**You just need to add your `DATABASE_URL`!**

---

## 📝 Next Steps

1. **Get your Supabase connection string** (follow Step 1 above)
2. **Update `.env.local`** with your connection string
3. **Tell me:** "I've added my DATABASE_URL" or "I need help getting it"

Then I'll help you push the database schema and create the admin user!


