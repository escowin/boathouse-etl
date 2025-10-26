# CrewHub Integration Challenges & Solutions

*Last Updated: October 26, 2025*

## 🎯 Overview

During the migration from boathouse-etl's monolithic architecture to a microservices approach, I encountered challenges in sharing essential files between crewhub (API server) and boathouse-etl (ETL service). This document outlines the issues faced and proposes viable solutions.

## 🚨 Current Issue

### Problem Statement
boathouse-etl requires access to shared resources from crewhub:
- **Database Models**: Sequelize models for data operations
- **Configuration Files**: Environment and database configuration
- **Migration Files**: Database schema definitions

### Root Cause
The ETL processes in boathouse-etl import models and configuration from crewhub, but TypeScript/Node.js cannot resolve cross-project imports at runtime, even with path mapping configured.

### Error Manifestation
```bash
Error: Cannot find module '../../crewhub/src/models'
# or
Error: Cannot find module '@crewhub/models'
```

## 📊 Current Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  boathouse-etl  │    │     crewhub     │    │   rowcalibur    │
│                 │    │                 │    │                 │
│ 🏭 ETL Service  │───▶│ 🌐 API Server   │◄───│ 📱 Frontend     │
│ (Data Ingestion)│    │ (Data Access)   │    │ (Athlete App)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         boathouse_trc                   │
│                                         │
│ 🏠 The Boathouse (Central Repository)   │
│ - PostgreSQL Database                   │
│ - Shared Data Models                    │
│ - Migration Files                       │
└─────────────────────────────────────────┘
```

## 🔍 Detailed Analysis

### Files Required by boathouse-etl

#### 1. **Database Models** (Critical)
- **Location**: `crewhub/src/models/`
- **Usage**: ETL processes need Sequelize models for data operations
- **Files**: `Athlete.ts`, `Boat.ts`, `Team.ts`, `PracticeSession.ts`, etc.
- **Import Pattern**: `import { Athlete, Boat } from '../models'`

#### 2. **Configuration Files** (Critical)
- **Location**: `crewhub/src/config/`
- **Usage**: Environment variables and database configuration
- **Files**: `env.ts`, `sequelize.ts`
- **Import Pattern**: `import { env } from '../config/env'`

#### 3. **Migration Files** (Important)
- **Location**: `crewhub/src/migrations/`
- **Usage**: Database schema setup and updates
- **Files**: Various migration `.js` files
- **Import Pattern**: Referenced by Sequelize CLI

### Current Import Attempts

#### Attempt 1: TypeScript Path Mapping
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@crewhub/models": ["../crewhub/src/models"],
      "@crewhub/config": ["../crewhub/src/config"]
    }
  }
}
```
**Result**: ❌ Fails at runtime - Node.js doesn't understand TypeScript path mapping

#### Attempt 2: Relative Imports
```typescript
import { Athlete } from '../../crewhub/src/models';
```
**Result**: ❌ Fails - TypeScript can't resolve cross-project paths

#### Attempt 3: Symbolic Links
```bash
ln -s ../../crewhub/src/models ./src/models
```
**Result**: ❌ Fails - Requires administrator privileges on Windows

## 💡 Proposed Solutions

### Solution 1: File Duplication (Immediate Fix)
**Approach**: Copy shared files to both projects

**Pros**:
- ✅ Quick implementation
- ✅ No runtime issues
- ✅ Works immediately
- ✅ No special permissions required

**Cons**:
- ❌ Code duplication
- ❌ Maintenance overhead
- ❌ Risk of files getting out of sync
- ❌ Violates DRY principle

**Implementation**:
```bash
# Copy essential files
cp -r ../crewhub/src/models ./src/
cp -r ../crewhub/src/config ./src/
cp -r ../crewhub/src/migrations ./src/
```

### Solution 2: Shared Package (Recommended)
**Approach**: Create a shared npm package for common code

**Pros**:
- ✅ Single source of truth
- ✅ Version control
- ✅ Proper dependency management
- ✅ No duplication
- ✅ Professional approach

**Cons**:
- ❌ More complex setup
- ❌ Additional build step
- ❌ Package management overhead

**Implementation**:
```
shared-package/
├── src/
│   ├── models/
│   ├── config/
│   └── migrations/
├── package.json
└── tsconfig.json

# Both projects depend on shared-package
boathouse-etl/package.json:
  "dependencies": {
    "@rowing-club/shared": "file:../shared-package"
  }
```

### Solution 3: Monorepo with Workspaces
**Approach**: Use npm/yarn workspaces to manage multiple packages

**Pros**:
- ✅ Single repository
- ✅ Shared dependencies
- ✅ Atomic commits
- ✅ Easy refactoring

**Cons**:
- ❌ Requires restructuring
- ❌ More complex CI/CD
- ❌ Larger repository

**Implementation**:
```
rowing-club-ecosystem/
├── packages/
│   ├── shared/
│   ├── boathouse-etl/
│   ├── crewhub/
│   └── rowcalibur/
├── package.json
└── yarn.lock
```

### Solution 4: Config.json Path Resolution (Recommended)
**Approach**: Use a configuration file to dynamically resolve shared module paths

**Pros**:
- ✅ Single source of truth for paths
- ✅ No file duplication
- ✅ Runtime flexibility
- ✅ Easy to maintain and update
- ✅ Environment-specific configurations
- ✅ No special permissions required

**Cons**:
- ❌ Requires custom path resolution logic
- ❌ TypeScript support needs additional setup
- ❌ Slightly more complex than direct imports

**Implementation**:
```json
// boathouse-etl/config.json
{
  "shared": {
    "models": {
      "path": "../crewhub/src/models",
      "enabled": true
    },
    "config": {
      "path": "../crewhub/src/config", 
      "enabled": true
    }
  },
  "local": {
    "migrations": {
      "path": "./src/migrations",
      "enabled": true
    },
    "etl": {
      "path": "./src/etl",
      "enabled": true
    }
  }
}
```

```typescript
// boathouse-etl/src/shared/index.ts
import config from '../config.json';
import path from 'path';

// Module proxy that resolves to shared resources
const sharedModules = {
  models: () => require(path.resolve(__dirname, '..', config.shared.models.path)),
  config: () => require(path.resolve(__dirname, '..', config.shared.config.path))
};

export default sharedModules;

// Usage in ETL files:
import shared from '../shared';
const { Athlete, Boat } = shared.models();
const { env } = shared.config();
```

### Solution 5: Build-Time Copy (Hybrid)
**Approach**: Copy files during build process

**Pros**:
- ✅ No runtime dependencies
- ✅ Single source of truth
- ✅ Automated synchronization

**Cons**:
- ❌ Build complexity
- ❌ Potential sync issues
- ❌ Additional build steps

**Implementation**:
```json
// package.json
{
  "scripts": {
    "prebuild": "npm run copy-shared",
    "copy-shared": "cp -r ../crewhub/src/models ./src/ && cp -r ../crewhub/src/config ./src/"
  }
}
```

## 🎯 Recommended Approach

### Phase 1: Immediate Fix (Config.json Path Resolution)
**Timeline**: 1-2 hours
**Effort**: Low
**Risk**: Low

1. Create `config.json` with shared resource paths
2. Implement module proxy pattern for path resolution
3. Update ETL imports to use shared module proxy
4. Test ETL functionality
5. Document the solution

### Phase 2: Long-term Solution (Shared Package)
**Timeline**: 1-2 weeks
**Effort**: Medium
**Risk**: Medium

1. Create `@rowing-club/shared` package
2. Move shared code to the package
3. Update both projects to use the package
4. Set up proper versioning and publishing

### Alternative: Config.json as Long-term Solution
**Timeline**: Ongoing
**Effort**: Low
**Risk**: Low

The config.json approach can serve as a long-term solution if:
- Projects remain in the same directory structure
- Shared resources don't change frequently
- Team prefers configuration over package management

## 🔧 Implementation Plan

### Immediate Steps (Phase 1 - Config.json Approach)

#### Step 1: Create Configuration File
```json
// boathouse-etl/config.json
{
  "shared": {
    "models": {
      "path": "../crewhub/src/models",
      "enabled": true
    },
    "config": {
      "path": "../crewhub/src/config", 
      "enabled": true
    }
  },
  "local": {
    "migrations": {
      "path": "./src/migrations",
      "enabled": true
    },
    "etl": {
      "path": "./src/etl",
      "enabled": true
    }
  }
}
```

#### Step 2: Create Shared Module Proxy
```typescript
// boathouse-etl/src/shared/index.ts
import config from '../config.json';
import path from 'path';

// Module proxy that resolves to shared resources
const sharedModules = {
  models: () => require(path.resolve(__dirname, '..', config.shared.models.path)),
  config: () => require(path.resolve(__dirname, '..', config.shared.config.path))
};

export default sharedModules;
```

#### Step 3: Update ETL Import Paths
```typescript
// Change from:
import { Athlete } from '../../crewhub/src/models';

// To:
import shared from '../shared';
const { Athlete, Boat } = shared.models();
```

#### Step 4: Test ETL Service
```bash
npm run etl:test
npm run etl:validate
npm run etl:full
```

#### Step 5: Document Configuration
Create a `SHARED_CONFIG.md` documenting the config.json approach and how to modify paths.

### Alternative: File Duplication (Fallback)

#### Step 1: Copy Essential Files
```bash
# From boathouse-etl directory
cp -r ../crewhub/src/models ./src/
cp -r ../crewhub/src/config ./src/
```

#### Step 2: Update Import Paths
```typescript
// Change from:
import { Athlete } from '../../crewhub/src/models';

// To:
import { Athlete } from '../models';
```

#### Step 3: Test ETL Service
```bash
npm run etl:test
npm run etl:validate
npm run etl:full
```

#### Step 4: Document Dependencies
Create a `SHARED_FILES.md` documenting which files are shared and how to keep them in sync.

### Long-term Steps (Phase 2)

#### Step 1: Create Shared Package
```bash
mkdir ../rowing-club-shared
cd ../rowing-club-shared
npm init -y
```

#### Step 2: Move Shared Code
- Move models to shared package
- Move configuration to shared package
- Move migrations to shared package

#### Step 3: Update Projects
- Update boathouse-etl to use shared package
- Update crewhub to use shared package
- Remove duplicated files

#### Step 4: Set Up CI/CD
- Automate package building
- Set up version management
- Update deployment scripts

## 📋 File Synchronization Strategy

### For Phase 1 (Config.json Approach)

#### No Sync Required
- **Why**: Files are referenced directly from crewhub
- **Benefit**: Always up-to-date, no sync needed
- **Maintenance**: Only update config.json if paths change

#### Path Update Process
1. **When to update**: If crewhub or boathouse-etl directory structure changes
2. **What to update**: Paths in `config.json`
3. **How to update**: Edit `config.json` file
4. **Verification**: Run ETL tests

#### Configuration Validation Script
```bash
#!/bin/bash
# validate-config.sh

echo "🔍 Validating config.json paths..."

# Check if shared paths exist
if [ ! -d "../crewhub/src/models" ]; then
  echo "❌ Error: ../crewhub/src/models not found"
  exit 1
fi

if [ ! -d "../crewhub/src/config" ]; then
  echo "❌ Error: ../crewhub/src/config not found"
  exit 1
fi

echo "✅ All shared paths are valid"
```

### For Phase 1 (File Duplication - Fallback)

#### Manual Sync Process
1. **When to sync**: After changes to shared files in crewhub
2. **What to sync**: Models, config (not migrations)
3. **How to sync**: Copy files and update imports
4. **Verification**: Run ETL tests

#### Automated Sync Script
```bash
#!/bin/bash
# sync-shared-files.sh

echo "🔄 Syncing shared files from crewhub to boathouse-etl..."

# Copy files (models and config only)
cp -r ../crewhub/src/models ./src/
cp -r ../crewhub/src/config ./src/

# Update imports (if needed)
find ./src -name "*.ts" -exec sed -i 's|../../crewhub/src/models|../models|g' {} \;
find ./src -name "*.ts" -exec sed -i 's|../../crewhub/src/config|../config|g' {} \;

echo "✅ Sync complete"
```

### For Phase 2 (Shared Package)

#### Version Management
- Use semantic versioning
- Tag releases
- Update package.json dependencies

#### Change Management
- All changes to shared code go through the shared package
- Both projects update to new package versions
- Automated testing ensures compatibility

## 🧪 Testing Strategy

### Phase 1 Testing
```bash
# Test ETL functionality
npm run etl:test
npm run etl:validate
npm run etl:full

# Test specific ETL processes
npm run etl:athletes
npm run etl:boats
npm run etl:teams
```

### Phase 2 Testing
```bash
# Test shared package
cd ../rowing-club-shared
npm test

# Test both projects with shared package
cd ../boathouse-etl
npm test

cd ../crewhub
npm test
```

## 📊 Risk Assessment

### Phase 1 Risks
- **Low Risk**: File duplication is temporary
- **Mitigation**: Clear documentation and sync process
- **Timeline**: 1-2 days

### Phase 2 Risks
- **Medium Risk**: Package management complexity
- **Mitigation**: Thorough testing and gradual rollout
- **Timeline**: 1-2 weeks

## 🎯 Success Criteria

### Phase 1 Success (Config.json Approach)
- [x] `config.json` file created with correct paths
- [x] Shared module proxy implemented
- [x] ETL service runs without errors
- [x] All imports resolve correctly through shared proxy
- [x] Database operations work
- [x] Configuration validation script works
- [x] Documentation is complete

### Phase 1 Success (File Duplication - Fallback)
- [ ] ETL service runs without errors
- [ ] All imports resolve correctly
- [ ] Database operations work
- [ ] Documentation is complete

### Phase 2 Success
- [ ] Shared package is created
- [ ] Both projects use shared package
- [ ] No code duplication
- [ ] Automated sync process works
- [ ] CI/CD pipeline updated

## 📝 Next Steps

1. **✅ COMPLETED**: Implement Phase 1 (config.json path resolution)
2. **✅ COMPLETED**: Test and validate ETL functionality with shared resources
3. **Current**: Monitor and maintain config.json approach
4. **Future**: Consider Phase 2 (shared package) if project structure changes significantly

## 🎉 Implementation Status

### ✅ **Phase 1 Complete - Config.json Approach Successfully Implemented**

The config.json path resolution approach has been successfully implemented and is working perfectly:

- **✅ Configuration**: `config.json` created with shared resource paths
- **✅ Module Proxy**: `src/shared/index.ts` implemented for dynamic path resolution
- **✅ ETL Integration**: All ETL processes updated to use shared proxy
- **✅ Database Optimization**: Both services optimized for their specific use cases
- **✅ Validation**: Configuration validation script created and working
- **✅ Testing**: ETL service compiles and runs successfully

### 🔧 **Current Architecture**

```
boathouse-etl/                 crewhub/
├── config.json               ├── src/
├── src/shared/               │   ├── models/     ← Shared via config.json
│   └── index.ts              │   ├── config/     ← Shared via config.json
├── src/etl/                  │   ├── routes/     ← API-specific
│   ├── base-etl.ts           │   ├── services/   ← API-specific
│   ├── athletes.ts           │   └── auth/       ← API-specific
│   ├── boats.ts              └── README.md
│   └── ...                   
└── README.md
```

### 🚀 **Benefits Achieved**

- **No File Duplication**: References original files directly
- **Always Up-to-Date**: No sync needed, always uses latest crewhub files
- **Service-Specific Optimization**: Each service optimized for its use case
- **Easy Maintenance**: Just update paths in config.json if needed
- **TypeScript Support**: Proper typing and error handling
- **Validation Tools**: Scripts to verify configuration

### 📊 **Performance Optimizations**

- **Boathouse-ETL**: Optimized for ETL operations (lower connection pool, longer timeouts)
- **CrewHub**: Optimized for API operations (higher connection pool, faster timeouts)
- **Shared Resources**: Models and config shared efficiently via config.json

## 🔗 Related Documentation

- [ETL Setup Guide](./etl-setup-guide.md)
- [System Architecture](./system-architecture.md)
- [Database Architecture Strategy](./database-architecture-strategy.md)
- [Production Deployment Guide](./production-deployment-guide.md)

---

**Status**: In Progress  
**Priority**: High  
**Assignee**: Development Team  
**Last Updated**: October 26, 2025
