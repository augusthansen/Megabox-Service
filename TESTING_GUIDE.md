# 🧪 Testing Guide - Step by Step

This guide will walk you through testing your Megabox Service Portal step by step.

## ✅ Test 1: Basic Next.js App (No Database)

**Status:** ✅ **PASSING** - Your app is running!

### What to do:
1. Open your web browser
2. Go to: **http://localhost:3000**
3. You should see: "Megabox Service Portal" with a subtitle

**What you're seeing:**
- This is your home page (`app/page.tsx`)
- It's working without a database connection
- The server is running successfully!

**If you see an error:** Let me know what the error message says.

---

## 🔧 Test 2: Set Up Database Connection

Before we can test the database, we need to set up your environment variables.

### Step 2.1: Get Your Supabase Database URL

1. Go to [supabase.com](https://supabase.com) and log in
2. Open your project
3. Go to **Settings** (gear icon) → **Database**
4. Scroll to **Connection string**
5. Select **URI** tab
6. Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

### Step 2.2: Create .env.local File

I'll help you create this file. You'll need:
- Your Supabase `DATABASE_URL`
- A random secret for NextAuth (I'll generate this for you)

### Step 2.3: Generate NextAuth Secret

Run this command in your terminal:
```bash
openssl rand -base64 32
```

Copy the output - that's your `NEXTAUTH_SECRET`.

---

## 🗄️ Test 3: Connect to Database

Once `.env.local` is set up, we'll:
1. Push the database schema to Supabase
2. Create all the tables
3. Seed the database with an admin user

---

## 👤 Test 4: Verify Admin User

After seeding, we'll verify the admin user was created:
- Email: `admin@megaboxsupply.com`
- Password: `admin123`

---

## 🎯 Current Status

- ✅ Next.js app is running
- ⏳ Database connection (waiting for your Supabase URL)
- ⏳ Database tables (waiting for connection)
- ⏳ Admin user (waiting for database)

---

## 🆘 Troubleshooting

**Problem:** Can't see http://localhost:3000
- **Solution:** Make sure the dev server is running (`npm run dev`)

**Problem:** Page shows an error
- **Solution:** Check the terminal for error messages and share them with me

**Problem:** Don't have Supabase set up yet
- **Solution:** That's okay! We can test the basic app first, then set up the database later.

---

## 📝 Next Steps

1. **Right now:** Open http://localhost:3000 in your browser and confirm you see the home page
2. **Next:** Set up your Supabase database connection
3. **Then:** We'll test the database and create the admin user


