# USRA Category Service Implementation

## Overview

This document describes the implementation of USRA category resolution in the service layer to reduce complexity for user-facing applications.

## Problem Solved

Previously, athlete data was returned without USRA category information, requiring frontend applications to:
1. Make separate API calls to get USRA categories
2. Perform client-side joins
3. Handle undefined category scenarios

## Solution

### Service Layer Implementation

Created `AthleteService` in `src/services/athleteService.ts` that:
- Performs database joins between `athletes` and `usra_categories` tables
- Calculates age from birth year
- Returns enriched athlete data with USRA category information
- Handles undefined categories gracefully (returns `undefined` for frontend to display as "N/A")

### Database Query Strategy

Uses Sequelize `include` with `required: false` for LEFT JOIN:

```typescript
const athletes = await Athlete.findAll({
  include: [{
    model: UsraCategory,
    as: 'usra_age_category',
    required: false, // LEFT JOIN to include athletes without USRA categories
    attributes: ['category']
  }],
  // ... other options
});
```

### API Endpoints Updated

#### 1. `GET /api/athletes` (IndexedDB Data)
- **Before**: Returned basic athlete data without USRA categories
- **After**: Returns athlete data with `usra_category` field included
- **Use Case**: Frontend IndexedDB storage for team management

#### 2. `GET /api/athletes/:id` (Complete Profile)
- **Before**: Returned profile data without USRA categories
- **After**: Returns complete profile with `usra_category` field included
- **Use Case**: User profile display and local storage

#### 3. `GET /api/athletes/all` (Admin Endpoint)
- **New**: Returns all athletes with USRA categories and filtering options
- **Use Case**: Administrative purposes and debugging

### Response Format

All endpoints now return athlete data in this format:

```typescript
interface AthleteWithUsraData {
  athlete_id: string;
  name: string;
  age?: number;                    // Calculated from birth_year
  usra_category?: string;          // From joined usra_categories table
  usra_age_category_id?: number;   // Foreign key reference
  // ... other athlete fields
}
```

### Handling Undefined Categories

- **Database Level**: Athletes with `usra_age_category_id = null` or invalid IDs
- **Service Level**: Returns `usra_category: undefined` for these athletes
- **Frontend Level**: Displays "N/A" for undefined categories (existing behavior)

### Benefits

1. **Reduced Frontend Complexity**: No need for client-side joins or multiple API calls
2. **Better Performance**: Single database query with JOIN instead of multiple queries
3. **Consistent Data**: All athlete endpoints return the same enriched data structure
4. **Maintainable**: Centralized USRA category logic in service layer
5. **Testable**: Service methods can be unit tested independently

### Testing

Run the test script to verify implementation:

```bash
npm run ts-node src/scripts/test-usra-categories.ts
```

The test script verifies:
- IndexedDB athlete data retrieval
- Complete athlete profile retrieval
- USRA category distribution analysis
- Database relationship integrity
- Filter functionality

### Migration Notes

- **Backward Compatible**: Existing frontend code will continue to work
- **Enhanced Data**: Frontend can now access `usra_category` field directly
- **No Breaking Changes**: All existing fields remain unchanged

### Future Enhancements

1. **Caching**: Add Redis caching for frequently accessed USRA categories
2. **Auto-Assignment**: Automatically assign USRA categories based on age for athletes without categories
3. **Validation**: Add validation to ensure USRA category assignments are correct
4. **Audit Trail**: Track when USRA categories are assigned or changed

## Files Modified

- `src/services/athleteService.ts` - New service implementation
- `src/services/index.ts` - Export new service
- `src/routes/athletes.ts` - Updated to use service layer
- `src/scripts/test-usra-categories.ts` - Test script
- `docs/usra-category-service-implementation.md` - This documentation

## Database Schema

The implementation relies on the existing relationship:

```sql
-- athletes table
usra_age_category_id INTEGER REFERENCES usra_categories(usra_category_id)

-- usra_categories table  
usra_category_id SERIAL PRIMARY KEY
start_age INTEGER
end_age INTEGER
category VARCHAR(100)
```

This relationship is already defined in the Sequelize models and database schema.
