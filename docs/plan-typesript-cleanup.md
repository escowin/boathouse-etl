# TypeScript Cleanup Plan - Boathouse ETL Services

## Overview
This document outlines a comprehensive plan to ensure type consistency between boathouse-etl services and RowCalibur frontend. The goal is to align field naming conventions and data structures to maintain consistency across all layers while preserving the ETL functionality.

## Current Status Analysis

### ✅ **RowCalibur Frontend (Completed)**
- **Type Definitions**: All types now use `snake_case` naming to match database models
- **Service Layer**: All services updated to use streamlined types
- **Component Layer**: All components updated to use consistent field names
- **Build Status**: 0 TypeScript errors, clean build output

### 🔄 **Boathouse ETL Services (Needs Analysis)**
- **Current State**: Mixed naming conventions (pascalCase in interfaces, snake_case in database)
- **API Layer**: Returns data with mixed naming conventions
- **Service Layer**: Uses both pascalCase and snake_case inconsistently

## Root Cause Analysis

### **Primary Issues Identified**

1. **Interface Naming Inconsistencies**:
   - `AthleteWithUsraData` interface uses `pascalCase` (e.g., `birthYear`, `portStarboard`, `sweepScull`)
   - Database models use `snake_case` (e.g., `birth_year`, `port_starboard`, `sweep_scull`)
   - API responses mix both conventions

2. **Service Layer Inconsistencies**:
   - `athleteService.ts`: Returns `pascalCase` fields in `AthleteWithUsraData`
   - `lineupService.ts`: Uses `snake_case` in interfaces (correct)
   - `attendanceService.ts`: Uses `snake_case` in interfaces (correct)
   - `ladderService.ts`: Uses `snake_case` in interfaces (correct)

3. **API Response Format Issues**:
   - Some endpoints return `pascalCase` data that RowCalibur expects in `snake_case`
   - Data transformation needed between boathouse-etl and RowCalibur

## Data Flow Analysis

### **Current Data Flow:**
```
Database (snake_case) 
    ↓
Boathouse ETL Services (mixed conventions)
    ↓
API Routes (mixed conventions)
    ↓
RowCalibur Frontend (snake_case) ← EXPECTS CONSISTENT FORMAT
```

### **API Endpoints Used by RowCalibur:**
- `/api/data/athletes` - Returns `AthleteWithUsraData[]` with `pascalCase`
- `/api/data/athletes/detailed` - Returns detailed athlete data
- `/api/data/lineups/*` - Returns `snake_case` data (correct)
- `/api/data/attendance/*` - Returns `snake_case` data (correct)

## Strategic Approach

### **Phase 1: Service Layer Standardization** 🔄 PENDING
**Goal**: Align all service interfaces with database naming conventions

#### 1.1 High Priority Services
1. **`athleteService.ts`** - CRITICAL
   - **Issue**: `AthleteWithUsraData` interface uses `pascalCase`
   - **Impact**: RowCalibur receives inconsistent data format
   - **Solution**: Update interface to use `snake_case` field names
   - **Files to Update**:
     - `AthleteWithUsraData` interface
     - `getAthletesForIndexedDB()` method
     - `getCompleteAthleteProfile()` method
     - All data transformation logic

#### 1.2 Medium Priority Services
2. **`lineupService.ts`** - ✅ ALREADY CORRECT
   - Uses `snake_case` consistently
   - No changes needed

3. **`attendanceService.ts`** - ✅ ALREADY CORRECT
   - Uses `snake_case` consistently
   - No changes needed

4. **`ladderService.ts`** - ✅ ALREADY CORRECT
   - Uses `snake_case` consistently
   - No changes needed

### **Phase 2: API Response Standardization** 🔄 PENDING
**Goal**: Ensure all API responses use consistent `snake_case` naming

#### 2.1 API Route Updates
1. **`/api/athletes`** - CRITICAL
   - Update to return `snake_case` field names
   - Ensure compatibility with RowCalibur expectations

2. **`/api/athletes/:id`** - CRITICAL
   - Update to return `snake_case` field names
   - Ensure profile data consistency

#### 2.2 Data Transformation Layer
- Add transformation utilities if needed for backward compatibility
- Ensure ETL processes remain unaffected

### **Phase 3: Validation and Testing** 🔄 PENDING
**Goal**: Ensure all changes work correctly and maintain functionality

#### 3.1 API Testing
- Test all athlete-related endpoints
- Verify data format consistency
- Ensure RowCalibur integration works correctly

#### 3.2 ETL Process Validation
- Verify ETL processes remain unaffected
- Test Google Sheets integration
- Ensure data import/export functionality

## Implementation Plan

### **Week 1: Service Layer Cleanup**
- [ ] Update `AthleteWithUsraData` interface to use `snake_case`
- [ ] Update `getAthletesForIndexedDB()` method
- [ ] Update `getCompleteAthleteProfile()` method
- [ ] Test service layer changes

### **Week 2: API Layer Updates**
- [ ] Update athlete API routes to return `snake_case` data
- [ ] Test API endpoint responses
- [ ] Verify RowCalibur integration

### **Week 3: Validation and Documentation**
- [ ] Comprehensive testing of all changes
- [ ] Update API documentation
- [ ] Create migration guide for any breaking changes

## Detailed Changes Required

### **1. AthleteService Interface Updates**

#### **Current Interface (INCORRECT):**
```typescript
export interface AthleteWithUsraData {
  id: string;
  name: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  active: boolean;
  gender?: 'M' | 'F';
  age?: number | undefined;
  birthYear?: number | string;           // ❌ Should be birth_year
  portStarboard?: 'Starboard' | ...;     // ❌ Should be port_starboard
  sweepScull?: 'Sweep' | ...;            // ❌ Should be sweep_scull
  usraAgeCategory?: string;              // ❌ Should be usra_age_category
  weightKg?: number | string;            // ❌ Should be weight_kg
  heightCm?: number | string;            // ❌ Should be height_cm
  email?: string;
  phone?: string;
  bowInDark?: boolean;                   // ❌ Should be bow_in_dark
  experience?: number | string;          // ❌ Should be experience_years
  emergencyContact?: string;             // ❌ Should be emergency_contact
  emergencyContactPhone?: string;        // ❌ Should be emergency_contact_phone
}
```

#### **Updated Interface (CORRECT):**
```typescript
export interface AthleteWithUsraData {
  athlete_id: string;                    // ✅ Consistent with database
  name: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  active: boolean;
  gender?: 'M' | 'F';
  age?: number | undefined;
  birth_year?: number | string;          // ✅ snake_case
  port_starboard?: 'Starboard' | ...;    // ✅ snake_case
  sweep_scull?: 'Sweep' | ...;           // ✅ snake_case
  usra_age_category?: string;            // ✅ snake_case
  weight_kg?: number | string;           // ✅ snake_case
  height_cm?: number | string;           // ✅ snake_case
  email?: string;
  phone?: string;
  bow_in_dark?: boolean;                 // ✅ snake_case
  experience_years?: number | string;    // ✅ snake_case
  emergency_contact?: string;            // ✅ snake_case
  emergency_contact_phone?: string;      // ✅ snake_case
}
```

### **2. Service Method Updates**

#### **Current Method (INCORRECT):**
```typescript
async getAthletesForIndexedDB(): Promise<AthleteWithUsraData[]> {
  // Returns data with pascalCase field names
  return athletes.map(athlete => ({
    id: athlete.athlete_id,
    name: athlete.name,
    birthYear: athlete.birth_year,        // ❌ pascalCase
    portStarboard: athlete.port_starboard, // ❌ pascalCase
    // ... other fields
  }));
}
```

#### **Updated Method (CORRECT):**
```typescript
async getAthletesForIndexedDB(): Promise<AthleteWithUsraData[]> {
  // Returns data with snake_case field names
  return athletes.map(athlete => ({
    athlete_id: athlete.athlete_id,      // ✅ snake_case
    name: athlete.name,
    birth_year: athlete.birth_year,      // ✅ snake_case
    port_starboard: athlete.port_starboard, // ✅ snake_case
    // ... other fields
  }));
}
```

## Risk Assessment

### **Low Risk Changes**
- **Interface Updates**: Type-only changes, no runtime impact
- **Service Method Updates**: Internal logic changes, API contracts maintained
- **Data Transformation**: Can be done incrementally

### **Medium Risk Changes**
- **API Response Format**: May require RowCalibur updates
- **Field Name Changes**: Could break existing integrations

### **Mitigation Strategies**
1. **Backward Compatibility**: Maintain old field names during transition
2. **Incremental Updates**: Update one service at a time
3. **Comprehensive Testing**: Test all API endpoints after changes
4. **Documentation**: Clear migration guide for any breaking changes

## Success Criteria

### **Technical Goals**
- **Consistent Naming**: All services use `snake_case` field names
- **API Consistency**: All API responses use consistent format
- **Type Safety**: No TypeScript errors in service layer
- **RowCalibur Compatibility**: Frontend receives expected data format

### **Quality Goals**
- **Maintainable Code**: Consistent patterns across all services
- **Clear Documentation**: Updated API documentation
- **Reliable Integration**: Seamless data flow between layers

## ETL Process Considerations

### **Areas to AVOID (ETL-Specific)**
- **Google Sheets Integration**: No changes to ETL data import/export
- **Data Migration Scripts**: No changes to existing migration logic
- **ETL Service Layer**: Focus only on API-facing services
- **Database Schema**: No changes to existing database structure

### **Safe Areas for Changes**
- **API Response Formatting**: Safe to update response field names
- **Service Interface Definitions**: Safe to update TypeScript interfaces
- **Data Transformation Logic**: Safe to update field mapping
- **API Route Handlers**: Safe to update response formatting

## Next Steps

### **Immediate Actions**
1. **Analyze Current State**: Review all service interfaces and API responses
2. **Create Test Plan**: Develop comprehensive testing strategy
3. **Update Documentation**: Document current inconsistencies and planned changes

### **Implementation Priority**
1. **High Priority**: `athleteService.ts` interface updates
2. **Medium Priority**: API route response formatting
3. **Low Priority**: Documentation and testing updates

## Conclusion

This cleanup will ensure complete consistency between boathouse-etl and RowCalibur, eliminating data transformation issues and improving maintainability. The focus is on API-facing services while preserving the ETL functionality that handles Google Sheets integration.

The changes are low-risk and can be implemented incrementally, with comprehensive testing to ensure no breaking changes to existing functionality.
