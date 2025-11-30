#!/bin/bash

# Script to add Twilio environment variables to .env.local

echo "Adding Twilio environment variables to .env.local..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local file not found!"
    exit 1
fi

# Check if Twilio variables already exist
if grep -q "TWILIO_ACCOUNT_SID" .env.local; then
    echo "⚠️  Twilio variables already exist in .env.local"
    read -p "Do you want to update them? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing Twilio variables
    sed -i '' '/^# Twilio/,/^TWILIO_TWIML_APP_SID=/d' .env.local
fi

# Append Twilio variables
cat >> .env.local << 'EOF'

# Twilio (for phone calling)
# Get from Twilio Console > Account > API Keys & Tokens
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_API_KEY="your-twilio-api-key"
TWILIO_API_SECRET="your-twilio-api-secret"
# Your Twilio phone number (E.164 format, e.g., +1234567890)
TWILIO_PHONE_NUMBER="+1234567890"
# TwiML App SID (create in Twilio Console > Runtime > TwiML > TwiML Apps)
TWILIO_TWIML_APP_SID="your-twiml-app-sid"
EOF

echo "✅ Added Twilio environment variables to .env.local"
echo ""
echo "📝 IMPORTANT: You need to replace the placeholder values with your actual Twilio credentials:"
echo "   1. TWILIO_ACCOUNT_SID - From Twilio Console > Account Info"
echo "   2. TWILIO_AUTH_TOKEN - From Twilio Console > Account Info"
echo "   3. TWILIO_API_KEY - Create in Twilio Console > API Keys & Tokens"
echo "   4. TWILIO_API_SECRET - Created with API Key (only shown once!)"
echo "   5. TWILIO_PHONE_NUMBER - Your Twilio phone number (E.164 format)"
echo "   6. TWILIO_TWIML_APP_SID - Create in Twilio Console > Runtime > TwiML Apps"
echo ""
echo "See TWILIO_SETUP.md for detailed instructions."

