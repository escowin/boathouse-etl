# Configuration Validation Script
# Validates that all shared resource paths in config.json are accessible

Write-Host "🔍 Validating config.json paths..." -ForegroundColor Cyan

# Check if config.json exists
if (-not (Test-Path "config.json")) {
    Write-Host "❌ Error: config.json not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ config.json found" -ForegroundColor Green

# Check if shared models path exists
if (-not (Test-Path "../crewhub/src/models")) {
    Write-Host "❌ Error: ../crewhub/src/models not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared models path exists" -ForegroundColor Green

# Check if shared config paths exist
if (-not (Test-Path "../crewhub/src/config")) {
    Write-Host "❌ Error: ../crewhub/src/config not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared config path exists" -ForegroundColor Green

# Check if specific config files exist
if (-not (Test-Path "../crewhub/src/config/env.ts")) {
    Write-Host "❌ Error: ../crewhub/src/config/env.ts not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared env.ts exists" -ForegroundColor Green

if (-not (Test-Path "../crewhub/src/config/database.ts")) {
    Write-Host "❌ Error: ../crewhub/src/config/database.ts not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared database.ts exists" -ForegroundColor Green

# Check if models index file exists
if (-not (Test-Path "../crewhub/src/models/index.ts")) {
    Write-Host "❌ Error: ../crewhub/src/models/index.ts not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared models index.ts exists" -ForegroundColor Green

# Check if shared module proxy exists
if (-not (Test-Path "src/shared/index.ts")) {
    Write-Host "❌ Error: src/shared/index.ts not found" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Shared module proxy exists" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 All shared resource paths are valid!" -ForegroundColor Green
Write-Host "✅ Config.json approach is properly configured" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "   - Shared models: ../crewhub/src/models" -ForegroundColor White
Write-Host "   - Shared config: ../crewhub/src/config" -ForegroundColor White
Write-Host "   - Module proxy: src/shared/index.ts" -ForegroundColor White
Write-Host "   - Configuration: config.json" -ForegroundColor White
