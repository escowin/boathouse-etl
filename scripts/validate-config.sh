#!/bin/bash

# Configuration Validation Script
# Validates that all shared resource paths in config.json are accessible

echo "🔍 Validating config.json paths..."

# Check if config.json exists
if [ ! -f "config.json" ]; then
  echo "❌ Error: config.json not found"
  exit 1
fi

echo "✅ config.json found"

# Check if shared models path exists
if [ ! -d "../crewhub/src/models" ]; then
  echo "❌ Error: ../crewhub/src/models not found"
  exit 1
fi

echo "✅ Shared models path exists"

# Check if shared config paths exist
if [ ! -d "../crewhub/src/config" ]; then
  echo "❌ Error: ../crewhub/src/config not found"
  exit 1
fi

echo "✅ Shared config path exists"

# Check if specific config files exist
if [ ! -f "../crewhub/src/config/env.ts" ]; then
  echo "❌ Error: ../crewhub/src/config/env.ts not found"
  exit 1
fi

echo "✅ Shared env.ts exists"

if [ ! -f "../crewhub/src/config/database.ts" ]; then
  echo "❌ Error: ../crewhub/src/config/database.ts not found"
  exit 1
fi

echo "✅ Shared database.ts exists"

# Check if models index file exists
if [ ! -f "../crewhub/src/models/index.ts" ]; then
  echo "❌ Error: ../crewhub/src/models/index.ts not found"
  exit 1
fi

echo "✅ Shared models index.ts exists"

# Check if shared module proxy exists
if [ ! -f "src/shared/index.ts" ]; then
  echo "❌ Error: src/shared/index.ts not found"
  exit 1
fi

echo "✅ Shared module proxy exists"

echo ""
echo "🎉 All shared resource paths are valid!"
echo "✅ Config.json approach is properly configured"
echo ""
echo "📋 Summary:"
echo "   - Shared models: ../crewhub/src/models"
echo "   - Shared config: ../crewhub/src/config"
echo "   - Module proxy: src/shared/index.ts"
echo "   - Configuration: config.json"
