#!/bin/bash

# Script to clear Next.js cache and fix build issues

echo "🧹 Clearing Next.js caches..."

# Clear .next directory
if [ -d .next ]; then
    rm -rf .next
    echo "✅ Cleared .next cache"
else
    echo "⚠️  .next directory not found"
fi

# Clear node_modules cache
if [ -d node_modules/.cache ]; then
    rm -rf node_modules/.cache
    echo "✅ Cleared node_modules cache"
else
    echo "⚠️  node_modules/.cache not found"
fi

echo ""
echo "✅ Cache cleared! Now restart your dev server:"
echo "   npm run dev"

