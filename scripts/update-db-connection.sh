#!/bin/bash

# Script to update DATABASE_URL in .env.local to use direct connection

echo "Updating DATABASE_URL to use direct connection..."

# Direct connection string format
# Password needs to be URL-encoded: * becomes %2A
DIRECT_URL='postgresql://postgres:Rmhc%2A153rmhc%2A153@db.duzsuwbfmqrbjbwpomjn.supabase.co:5432/postgres'

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Backup the original file
cp .env.local .env.local.backup
echo "✅ Created backup: .env.local.backup"

# Update DATABASE_URL
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|DATABASE_URL=.*|DATABASE_URL=\"$DIRECT_URL\"|" .env.local
else
    # Linux
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=\"$DIRECT_URL\"|" .env.local
fi

echo "✅ Updated DATABASE_URL to direct connection"
echo ""
echo "New connection string:"
grep DATABASE_URL .env.local
echo ""
echo "Now test the connection:"
echo "  npx tsx scripts/test-db-connection.ts"

