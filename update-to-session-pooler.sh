#!/bin/bash
# Update to use Supavisor Session pooler (better for Next.js)

echo "🔄 Updating to Session pooler connection..."

# Session pooler format: postgres.duzsuwbfmqrbjbwpomjn:[PASSWORD]@aws-0-us-west-2.pooler.supabase.com:5432/postgres
NEW_URL='postgresql://postgres.duzsuwbfmqrbjbwpomjn:Rmhc%2A153rmhc%2A153@aws-0-us-west-2.pooler.supabase.com:5432/postgres'

# Update .env.local
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"${NEW_URL}\"|g" .env.local

# Update .env
sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"${NEW_URL}\"|g" .env

echo "✅ Updated to Session pooler connection"
echo ""
echo "New connection string:"
grep DATABASE_URL .env.local
echo ""
echo "⚠️  Please restart your dev server!"
