#!/bin/bash

# TypeScript Conversion Cleanup Script
# This script safely removes JavaScript files that have been converted to TypeScript

echo "🧹 Starting cleanup of JavaScript files..."

# List of files to delete (converted to TypeScript)
declare -a js_files=(
    "app.js"
    "test-connection.js"
    "src/Utils/Utils.js"
    "src/Backpack/Authenticated/Authentication.js"
    "src/Backpack/Authenticated/Account.js"
    "src/Backpack/Authenticated/Order.js"
    "src/Backpack/Authenticated/Capital.js"
    "src/Backpack/Authenticated/Futures.js"
    "src/Backpack/Authenticated/BorrowLend.js"
    "src/Backpack/Authenticated/History.js"
    "src/Backpack/Public/Markets.js"
    "src/Backpack/Public/Assets.js"
    "src/Backpack/Public/BorrowLend.js"
    "src/Backpack/Public/System.js"
    "src/Backpack/Public/Trades.js"
    "src/Controllers/OrderController.js"
    "src/Controllers/AccountController.js"
    "src/Decision/Decision.js"
    "src/TrailingStop/TrailingStop.js"
)

# Count files
total_files=${#js_files[@]}
deleted_count=0

echo "📋 Found $total_files JavaScript files to delete..."
echo ""

# Delete each file
for file in "${js_files[@]}"; do
    if [ -f "$file" ]; then
        echo "🗑️  Deleting: $file"
        rm "$file"
        ((deleted_count++))
    else
        echo "⚠️  File not found: $file"
    fi
done

echo ""
echo "✅ Cleanup completed!"
echo "📊 Deleted $deleted_count out of $total_files files"

# Verify build still works
echo ""
echo "🔍 Verifying TypeScript build..."
if npm run build; then
    echo "✅ TypeScript build successful!"
    echo "🎉 JavaScript to TypeScript conversion completed successfully!"
else
    echo "❌ TypeScript build failed!"
    echo "⚠️  Please check for any remaining issues"
fi
