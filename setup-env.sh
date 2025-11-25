#!/bin/bash

# Simple script to help set up .env.local file

echo "🔧 Setting up .env.local file..."
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
fi

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
cat > .env.local << EOF
# Database (from Supabase)
# Replace [PASSWORD] and [PROJECT] with your actual Supabase values
DATABASE_URL="postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# HubSpot (optional for now)
HUBSPOT_API_KEY="your-hubspot-private-app-token"

# Daily.co (optional for now)
DAILY_API_KEY="your-daily-api-key"

# Google Workspace (optional for now)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# QuickBooks (optional for now)
QUICKBOOKS_CLIENT_ID="your-quickbooks-client-id"
QUICKBOOKS_CLIENT_SECRET="your-quickbooks-client-secret"
EOF

echo "✅ Created .env.local file!"
echo ""
echo "📝 IMPORTANT: You need to edit .env.local and add your Supabase DATABASE_URL"
echo ""
echo "To get your Supabase connection string:"
echo "1. Go to supabase.com and log in"
echo "2. Open your project"
echo "3. Go to Settings → Database"
echo "4. Copy the Connection string (URI format)"
echo "5. Replace the DATABASE_URL line in .env.local"
echo ""
echo "The NEXTAUTH_SECRET has been automatically generated for you! ✅"


