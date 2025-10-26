# Boat Type Enum Migration

## Overview

This document outlines the migration process to update the `boats` table's `type` column from the old enum values to the standardized boat type naming convention used throughout the Rowcalibur system.

## Problem

The existing `boats` table uses enum values that don't match the standardized naming convention:
- **Old Values**: `'Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight'`
- **New Values**: `'1x', '2x', '2-', '4x', '4+', '8+'`

This inconsistency causes issues when integrating with the gauntlet system and other parts of the application that expect the standardized format.

## Migration Strategy

### Challenge: PostgreSQL Enum Limitations

PostgreSQL doesn't allow direct modification of enum values when there's existing data. The migration process requires:

1. **Update existing data** to use new enum values
2. **Create new enum type** with standardized values
3. **Update column** to use new enum
4. **Drop old enum** and rename new one

### Migration Steps

#### 1. Data Mapping
```sql
-- Old → New mapping
'Single' → '1x'
'Double' → '2x'
'Pair' → '2-'
'Quad' → '4x'
'Four' → '4+'
'Eight' → '8+'
```

#### 2. Migration Process
```sql
-- Step 1: Update existing data
UPDATE boats 
SET type = CASE 
  WHEN type = 'Single' THEN '1x'
  WHEN type = 'Double' THEN '2x'
  WHEN type = 'Pair' THEN '2-'
  WHEN type = 'Quad' THEN '4x'
  WHEN type = 'Four' THEN '4+'
  WHEN type = 'Eight' THEN '8+'
  ELSE type
END;

-- Step 2: Create new enum
CREATE TYPE boat_type_enum_new AS ENUM ('1x', '2x', '2-', '4x', '4+', '8+');

-- Step 3: Update column
ALTER TABLE boats 
ALTER COLUMN type TYPE boat_type_enum_new 
USING type::text::boat_type_enum_new;

-- Step 4: Drop old enum
DROP TYPE boat_type_enum;

-- Step 5: Rename new enum
ALTER TYPE boat_type_enum_new RENAME TO boat_type_enum;
```

## Files Modified

### 1. Migration File
- **File**: `src/migrations/20250115000002-update-boat-type-enum.js`
- **Purpose**: Handles the database schema migration
- **Features**: 
  - Transactional safety
  - Rollback capability
  - Detailed logging

### 2. Boat Model
- **File**: `src/models/Boat.ts`
- **Changes**:
  - Updated TypeScript interfaces
  - Updated Sequelize enum definition
  - Maintains type safety

### 3. Database Schema Documentation
- **File**: `docs/multi-team-database-schema.md`
- **Changes**: Updated CHECK constraint to reflect new enum values

### 4. Migration Scripts
- **File**: `src/scripts/run-boat-type-migration.ts`
- **Purpose**: Executes migration with data verification
- **Features**:
  - Before/after data comparison
  - Enum value verification
  - Error handling

- **File**: `src/scripts/rollback-boat-type-migration.ts`
- **Purpose**: Rollback migration if needed
- **Features**:
  - Safe rollback process
  - Data verification
  - Error handling

## Running the Migration

### Prerequisites
1. **Backup Database**: Always backup before running migrations
2. **Check Dependencies**: Ensure no foreign key constraints reference the old enum
3. **Test Environment**: Run migration in test environment first

### Execution Steps

#### Option 1: Using Migration Script (Recommended)
```bash
# Run migration
npm run ts-node src/scripts/run-boat-type-migration.ts

# Or if rollback is needed
npm run ts-node src/scripts/rollback-boat-type-migration.ts
```

#### Option 2: Using Sequelize CLI
```bash
# Run migration
npx sequelize-cli db:migrate --migrations-path src/migrations --config src/config/sequelize.ts

# Rollback if needed
npx sequelize-cli db:migrate:undo --migrations-path src/migrations --config src/config/sequelize.ts
```

### Verification

After migration, verify:

1. **Data Integrity**: All boat records have correct new enum values
2. **Enum Values**: New enum contains only standardized values
3. **Application**: Boat model works correctly with new enum
4. **Foreign Keys**: No constraint violations

```sql
-- Verify data
SELECT type, COUNT(*) FROM boats GROUP BY type;

-- Verify enum values
SELECT unnest(enum_range(NULL::boat_type_enum)) as enum_value;
```

## Benefits

### 1. Consistency
- **Unified Naming**: All boat types use standardized format
- **Cross-System Compatibility**: Matches gauntlet system expectations
- **Future-Proof**: Aligns with rowing industry standards

### 2. Integration
- **Gauntlet System**: Seamless integration with gauntlet lineups
- **API Consistency**: Uniform boat type responses
- **Frontend Compatibility**: Consistent data format

### 3. Maintainability
- **Single Source of Truth**: One naming convention across all systems
- **Reduced Confusion**: No mapping between different formats
- **Easier Debugging**: Consistent data format

## Rollback Plan

If issues arise, the migration can be safely rolled back:

1. **Run rollback script**: `npm run ts-node src/scripts/rollback-boat-type-migration.ts`
2. **Verify data**: Check that all boat types reverted correctly
3. **Test application**: Ensure everything works with old enum values
4. **Investigate issues**: Fix problems before re-attempting migration

## Testing

### Pre-Migration Testing
```sql
-- Check current data
SELECT type, COUNT(*) FROM boats GROUP BY type;

-- Check for any constraints
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'boats' AND constraint_type = 'FOREIGN KEY';
```

### Post-Migration Testing
```sql
-- Verify new enum values
SELECT unnest(enum_range(NULL::boat_type_enum)) as enum_value;

-- Check data integrity
SELECT type, COUNT(*) FROM boats GROUP BY type;

-- Test boat creation
INSERT INTO boats (name, type) VALUES ('Test Boat', '1x');
```

## Impact Assessment

### Low Risk
- **Data Preservation**: All existing data is preserved
- **Rollback Capability**: Can be safely reverted
- **Transactional**: Migration runs in a transaction

### Considerations
- **Application Updates**: Ensure all code uses new enum values
- **API Changes**: Update any API documentation
- **Frontend Updates**: Update any hardcoded enum values

## Conclusion

This migration standardizes the boat type naming convention across the entire system, improving consistency and enabling better integration with the Rowcalibur competitive system. The migration is designed to be safe, reversible, and well-documented.
