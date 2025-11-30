#!/bin/bash
# Script to update DATABASE_URL to use direct connection

echo "🔄 Updating DATABASE_URL to use direct connection..."
echo ""

# Read current .env.local
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found!"
  exit 1
fi

# Create backup
cp .env.local .env.local.backup
echo "✅ Created backup: .env.local.backup"

# Replace pooler connection with direct connection
# Change: aws-0-us-west-2.pooler.supabase.com -> db.duzsuwbfmqrbjbwpomjn.supabase.co
# Change: postgres.duzsuwbfmqrbjbwpomjn -> postgres
sed -i '' 's|postgres.duzsuwbfmqrbjbwpomjn:Rmhc%2A153rmhc%2A153@aws-0-us-west-2.pooler.supabase.com:5432|postgres:Rmhc%2A153rmhc%2A153@db.duzsuwbfmqrbjbwpomjn.supabase.co:5432|g' .env.local

echo "✅ Updated DATABASE_URL to use direct connection"
echo ""
echo "New connection string:"
grep DATABASE_URL .env.local
echo ""
echo "⚠️  Please restart your dev server for changes to take effect!"
