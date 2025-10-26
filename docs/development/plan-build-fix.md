# Boathouse-ETL Build Fix Plan

## 🎯 **Objective**
Fix TypeScript build errors in boathouse-etl by updating import statements to use the shared module proxy system instead of direct imports to non-existent local modules.

## 🔍 **Root Cause Analysis**

### **Does boathouse-etl need a build?**
**YES** - boathouse-etl requires a build step because:
- Written in TypeScript requiring compilation to JavaScript
- Has `tsconfig.json` and build scripts in `package.json`
- Production deployment uses compiled JavaScript from `dist/` folder
- Runtime execution depends on compiled modules

### **Why is the build failing?**
The build fails because scripts use **direct imports** (`../models`, `../config/env`) instead of the **shared module proxy** system designed for this project. The shared module proxy (`src/shared/index.ts`) dynamically loads resources from CrewHub using paths defined in `config.json`.

## 📊 **Error Summary**
- **25 errors** across **14 files**
- **Primary Issue**: Cannot find modules that don't exist locally
- **Secondary Issue**: Implicit `any` types in some scripts

## 🛠️ **Implementation Plan**

### **Phase 1: Fix Import Statements (14 files)**

#### **Models Import Fixes (8 files)**
- `src/scripts/clear-attendance.ts` - Fix `../models` import
- `src/scripts/debug-athletes.ts` - Fix `../models/Athlete` import
- `src/scripts/fix-athlete-status.ts` - Fix `../models/Athlete` import
- `src/scripts/rollback-boat-type-migration.ts` - Fix `../models` import
- `src/scripts/rollback-gauntlet-ladder-migration.ts` - Fix `../models` import
- `src/scripts/run-boat-type-migration.ts` - Fix `../models` import
- `src/scripts/run-gauntlet-ladder-migration.ts` - Fix `../models` import
- `src/scripts/seed-practice-sessions.ts` - Fix `../models/PracticeSession` import
- `src/scripts/test-models.ts` - Fix `../models` import
- `src/scripts/test-usra-categories.ts` - Fix `../models` import

#### **Config Import Fixes (3 files)**
- `src/scripts/check-config.ts` - Fix `../config/env` import
- `src/scripts/debug-connection.ts` - Fix `../config/env` import
- `src/scripts/debug-google-sheets.ts` - Fix `../config/env` import

#### **Services Import Fixes (1 file)**
- `src/scripts/test-usra-categories.ts` - Fix `../services` import

#### **Auth Import Fixes (1 file)**
- `src/scripts/set-default-pins.ts` - Fix `../auth/authService` import

### **Phase 2: Update TypeScript Configuration**

**Problem**: TypeScript can't resolve shared module paths at compile time
**Solution**: Update `tsconfig.json` to include path mappings for shared resources

### **Phase 3: Fix Type Annotations**

**Problem**: Scripts have implicit `any` types causing TypeScript errors
**Solution**: Add proper type annotations for parameters

### **Phase 4: Test Build**

**Goal**: Verify that `npm run build` completes successfully

## 🔧 **Implementation Strategy**

### **Step 1: Update Shared Module Proxy**
- Ensure `src/shared/index.ts` is working correctly
- Verify config.json paths are valid

### **Step 2: Fix Imports Systematically**
- Start with models imports (most common)
- Then config imports
- Then services and auth imports
- Test build after each category

### **Step 3: Update TypeScript Configuration**
- Add path mappings for shared resources
- Ensure proper module resolution

### **Step 4: Fix Type Annotations**
- Add explicit types for parameters
- Resolve implicit `any` type errors

### **Step 5: Final Testing**
- Run `npm run build` to verify success
- Test a few scripts to ensure runtime works

## 📋 **Expected Outcome**

After implementation:
- ✅ `npm run build` completes without errors
- ✅ All scripts can import shared resources correctly
- ✅ TypeScript compilation succeeds
- ✅ Runtime execution works with shared module proxy
- ✅ Maintains separation between ETL and API concerns

## 🚨 **Risk Mitigation**

- **Backup**: Current working state is preserved
- **Incremental**: Fix one category at a time
- **Testing**: Build after each major change
- **Rollback**: Can revert individual changes if issues arise

---

**Status**: Ready for implementation  
**Priority**: High (blocks development workflow)  
**Estimated Time**: 2-3 hours
