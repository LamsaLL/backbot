#!/bin/bash

# Backbot Setup Script
echo "🚀 Setting up Backbot for testing..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.template .env
    echo "⚠️  IMPORTANT: Edit .env file with your actual API credentials!"
    echo "   nano .env"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed! Check TypeScript errors above."
    exit 1
fi

# Verify simulation mode
if grep -q "SIMULATION_MODE=true" .env; then
    echo "✅ SIMULATION_MODE is enabled (safe for testing)"
else
    echo "⚠️  WARNING: Make sure SIMULATION_MODE=true in .env file!"
fi

echo ""
echo "🧪 Ready for testing! Run these commands:"
echo "   npm run test:connection  # Test API connectivity"
echo "   npm test                 # Full system test"
echo "   npm run test:dry         # Trading logic test"
echo ""
echo "📖 See TESTING.md for detailed testing guide"
