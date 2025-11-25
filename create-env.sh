#!/bin/bash

echo "🔧 Creating .env.local file..."
echo ""

# Generate NextAuth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Create .env.local file
cat > .env.local << ENVFILE
# Database (from Supabase)
# ⚠️ YOU NEED TO REPLACE THIS with your actual Supabase connection string
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# HubSpot (optional - for later)
HUBSPOT_API_KEY="your-hubspot-private-app-token"

# Daily.co (optional - for later)
DAILY_API_KEY="your-daily-api-key"

# Google Workspace (optional - for later)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# QuickBooks (optional - for later)
QUICKBOOKS_CLIENT_ID="your-quickbooks-client-id"
QUICKBOOKS_CLIENT_SECRET="your-quickbooks-client-secret"
ENVFILE

echo "✅ Created .env.local file!"
echo ""
echo "📝 IMPORTANT: You need to edit .env.local and add your Supabase DATABASE_URL"
echo ""
echo "The NEXTAUTH_SECRET has been automatically generated: ${NEXTAUTH_SECRET}"
