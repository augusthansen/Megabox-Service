#!/bin/bash

# Comprehensive database connection fix script

echo "🔧 Fixing Database Connection..."
echo ""

# Step 1: Verify connection strings
echo "1. Checking connection strings..."
if grep -q "pooler.supabase.com" .env.local 2>/dev/null; then
    echo "   ⚠️  Found pooler connection in .env.local - updating..."
    sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:Rmhc%2A153rmhc%2A153@db.duzsuwbfmqrbjbwpomjn.supabase.co:5432/postgres"|' .env.local
fi

if grep -q "pooler.supabase.com" .env 2>/dev/null; then
    echo "   ⚠️  Found pooler connection in .env - updating..."
    sed -i '' 's|DATABASE_URL=.*|DATABASE_URL="postgresql://postgres:Rmhc%2A153rmhc%2A153@db.duzsuwbfmqrbjbwpomjn.supabase.co:5432/postgres"|' .env
fi

echo "   ✅ Connection strings verified"
echo ""

# Step 2: Clear Next.js cache
echo "2. Clearing Next.js cache..."
rm -rf .next
echo "   ✅ Cache cleared"
echo ""

# Step 3: Regenerate Prisma client
echo "3. Regenerating Prisma client..."
npx prisma generate
echo "   ✅ Prisma client regenerated"
echo ""

# Step 4: Test connection
echo "4. Testing database connection..."
npx tsx scripts/test-db-connection.ts
echo ""

echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Make sure your dev server is STOPPED (Ctrl+C)"
echo "   2. Restart it with: npm run dev"
echo "   3. Try logging in or accessing the app"

