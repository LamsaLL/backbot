#!/bin/bash

echo "🔧 Fixing ES module imports..."

# Find all .js files in dist and add .js extensions to relative imports
find dist -name "*.js" -type f -exec sed -i 's/from "\.\//from ".\//g; s/from "\.\.[^"]*"[^.]/&.js/g; s/from "\.[^"]*"[^.]/&.js/g' {} \;

# More specific fixes for common patterns
find dist -name "*.js" -type f -exec sed -i 's/from "\.\/\([^"]*\)"/from ".\/\1.js"/g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/from "\.\.\//from "..\/\//g' {} \;
find dist -name "*.js" -type f -exec sed -i 's/from "\.\.\([^"]*\)"/from "..\1.js"/g' {} \;

# Fix double .js.js extensions
find dist -name "*.js" -type f -exec sed -i 's/\.js\.js/\.js/g' {} \;

echo "✅ Import fixes applied"
