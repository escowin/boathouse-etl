# RowCalibur ↔ Boathouse-ETL Architecture & Data Flow

## System Overview

This document diagrams the relationship between RowCalibur's routes & services and Boathouse-ETL's routes, showing how athlete data flows between the systems at different authentication levels.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                ROWCALIBUR FRONTEND                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Logged Out    │  │   Logged In     │  │  Profile View   │                │
│  │   State         │  │   State         │  │   State         │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ROWCALIBUR BACKEND                                  │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ROUTES LAYER                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   dataRoutes.ts │  │   auth.ts       │  │   boatsRoutes.ts│        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ GET /athletes   │  │ POST /login     │  │ GET /boats      │        │   │
│  │  │ (no auth)       │  │ POST /verify    │  │ (auth required) │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ GET /athletes/  │  │                 │  │                 │        │   │
│  │  │ detailed        │  │                 │  │                 │        │   │
│  │  │ (auth required) │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                               │
│                                ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICES LAYER                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │PostgresDataService│  │  authService.ts │  │googleSheetsService│     │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ getAthletes()   │  │ login()         │  │ (fallback)      │        │   │
│  │  │ getDetailedAthletes()│ verifyToken() │  │                 │        │   │
│  │  │ getBoats()      │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            BOATHOUSE-ETL                                       │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        ROUTES LAYER                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   routes.ts     │  │   athletes.ts   │  │   boats.ts      │        │   │
│  │  │ (auth routes)   │  │ (data routes)   │  │ (data routes)   │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ GET /auth/      │  │ GET /api/       │  │ GET /api/data/  │        │   │
│  │  │ athletes        │  │ athletes        │  │ boats           │        │   │
│  │  │ (public)        │  │ (protected)     │  │ (protected)     │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ POST /auth/     │  │ GET /api/       │  │                 │        │   │
│  │  │ login           │  │ athletes/:id    │  │                 │        │   │
│  │  │                 │  │ (protected)     │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                               │
│                                ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      SERVICES LAYER                                   │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │  authService.ts │  │   Athlete Model │  │   Boat Model    │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ getActiveAthletes()│ findAll()      │  │ findAll()       │        │   │
│  │  │ login()         │  │ (with filters)  │  │ (with filters)  │        │   │
│  │  │ verifyToken()   │  │                 │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                │                                               │
│                                ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        DATABASE LAYER                                 │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │   │
│  │  │   Athletes      │  │     Boats       │  │   Other Tables  │        │   │
│  │  │   Table         │  │     Table       │  │                 │        │   │
│  │  │                 │  │                 │  │                 │        │   │
│  │  │ athlete_id      │  │ boat_id         │  │                 │        │   │
│  │  │ name            │  │ name            │  │                 │        │   │
│  │  │ email           │  │ type            │  │                 │        │   │
│  │  │ phone           │  │ rigging_type    │  │                 │        │   │
│  │  │ us_rowing_number│  │ status          │  │                 │        │   │
│  │  │ active          │  │ min_weight_kg   │  │                 │        │   │
│  │  │ competitive_status│ max_weight_kg   │  │                 │        │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow by Authentication State

### 1. LOGGED OUT STATE
```
RowCalibur Frontend (Logged Out)
    ↓ GET /api/athletes (no auth)
RowCalibur Backend (dataRoutes.ts)
    ↓ getAthletes()
PostgresDataService
    ↓ GET /auth/athletes
Boathouse-ETL (routes.ts)
    ↓ getActiveAthletes()
AuthService
    ↓ SELECT athlete_id, name FROM athletes WHERE active=true AND competitive_status='active'
Database (Athletes Table)
```

**Data Returned:**
```json
{
  "success": true,
  "data": [
    {"athlete_id": "ATH001", "name": "John Doe"},
    {"athlete_id": "ATH002", "name": "Jane Smith"}
  ]
}
```

### 2. LOGGED IN STATE (Detailed Athletes)
```
RowCalibur Frontend (Logged In)
    ↓ GET /api/athletes/detailed (with Bearer token)
RowCalibur Backend (dataRoutes.ts)
    ↓ getDetailedAthletes(authToken)
PostgresDataService
    ↓ GET /api/athletes (with Authorization header)
Boathouse-ETL (athletes.ts)
    ↓ authMiddleware.verifyToken + Athlete.findAll()
Database (Athletes Table)
```

**Data Returned:**
```json
{
  "success": true,
  "data": [
    {
      "athlete_id": "ATH001",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "555-1234",
      "weight_kg": 75,
      "birth_year": 1990,
      "type": "Rower",
      "active": true,
      "competitive_status": "active"
    }
  ]
}
```

### 3. PROFILE VIEW STATE (Individual Athlete)
```
RowCalibur Frontend (Profile View)
    ↓ GET /api/athletes/:id/profile (with Bearer token)
RowCalibur Backend (dataRoutes.ts)
    ↓ getAthleteProfile(athleteId)
PostgresDataService
    ↓ GET /api/athletes/:id (with Authorization header)
Boathouse-ETL (athletes.ts)
    ↓ authMiddleware.verifyToken + Athlete.findOne()
Database (Athletes Table)
```

**Data Returned:**
```json
{
  "success": true,
  "data": {
    "athlete_id": "ATH001",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "555-1234",
    "us_rowing_number": "12345",
    "emergency_contact": "Jane Doe",
    "emergency_contact_phone": "555-5678",
    "weight_kg": 75,
    "birth_year": 1990,
    "type": "Rower",
    "sweep_scull": "Sweep & Scull",
    "port_starboard": "Either",
    "bow_in_dark": false,
    "experience": 5,
    "active": true,
    "competitive_status": "active"
  }
}
```

## Key Authentication Levels

### Level 1: Public (No Authentication)
- **Endpoint:** `GET /auth/athletes` (Boathouse-ETL)
- **Purpose:** Athlete selection for login
- **Data:** Only `athlete_id` and `name`
- **Used by:** RowCalibur's `getAthletes()` method

### Level 2: Authenticated (Bearer Token Required)
- **Endpoint:** `GET /api/athletes` (Boathouse-ETL)
- **Purpose:** Detailed athlete data for IndexedDB storage
- **Data:** All athlete fields except sensitive information
- **Used by:** RowCalibur's `getDetailedAthletes()` method

### Level 3: Individual Profile (Bearer Token Required)
- **Endpoint:** `GET /api/athletes/:id` (Boathouse-ETL)
- **Purpose:** Complete athlete profile with contact details
- **Data:** All athlete fields including contact information
- **Used by:** RowCalibur's `getAthleteProfile()` method

## How to Add Key-Values to Athlete Fetch Requests

### 1. Adding Fields to Boathouse-ETL Database
First, add the new field to the Athletes table in Boathouse-ETL:

```sql
ALTER TABLE athletes ADD COLUMN new_field VARCHAR(255);
```

### 2. Updating Boathouse-ETL Athlete Model
Update the Athlete model in `src/models/Athlete.ts`:

```typescript
export interface AthleteAttributes {
  // ... existing fields
  new_field?: string;
}
```

### 3. Updating Boathouse-ETL Routes
Modify the `attributes` array in `src/routes/athletes.ts`:

```typescript
// For public endpoint (Level 1)
attributes: ['athlete_id', 'name'] // Keep minimal

// For authenticated endpoint (Level 2)
attributes: [
  'athlete_id', 'name', 'email', 'phone', 'weight_kg', 
  'birth_year', 'type', 'active', 'competitive_status',
  'new_field' // Add your new field here
]

// For individual profile (Level 3)
attributes: [
  'athlete_id', 'name', 'email', 'phone', 'us_rowing_number',
  'emergency_contact', 'emergency_contact_phone', 'weight_kg',
  'birth_year', 'type', 'sweep_scull', 'port_starboard',
  'bow_in_dark', 'experience', 'active', 'competitive_status',
  'new_field' // Add your new field here
]
```

### 4. Updating RowCalibur Interfaces
Update the Athlete interface in `src/services/postgresDataService.ts`:

```typescript
export interface Athlete {
  id: string;
  name: string;
  type: 'Cox' | 'Rower' | 'Rower & Coxswain';
  // ... existing fields
  new_field?: string; // Add your new field here
}
```

### 5. Example: Adding `rigging_type` to Boats (Already Implemented)
This is how `rigging_type` was added to boats:

**Boathouse-ETL (`src/routes/boats.ts`):**
```typescript
attributes: [
  'boat_id', 'name', 'type', 'status',
  'rigging_type', // ← Added here
  'min_weight_kg', 'max_weight_kg'
]
```

**RowCalibur (`src/services/postgresDataService.ts`):**
```typescript
export interface Boat {
  name: string;
  status: string;
  type: string;
  riggingType?: string; // ← Added here (camelCase for frontend)
  minWeight?: number;
  maxWeight?: number;
}
```

**Data transformation in RowCalibur:**
```typescript
const boatData = {
  id: boat.dataValues.boat_id,
  name: boat.dataValues.name,
  type: boat.dataValues.type,
  riggingType: boat.dataValues.rigging_type, // ← Transform snake_case to camelCase
  status: boat.dataValues.status,
  minWeight: boat.dataValues.min_weight_kg,
  maxWeight: boat.dataValues.max_weight_kg
};
```

## Summary

The architecture follows a clear pattern:
1. **RowCalibur Frontend** makes requests to **RowCalibur Backend**
2. **RowCalibur Backend** uses **PostgresDataService** to make API calls to **Boathouse-ETL**
3. **Boathouse-ETL** serves different data levels based on authentication
4. Data flows back through the same chain with appropriate transformations

To add new fields, you need to:
1. Add to Boathouse-ETL database and model
2. Include in the appropriate `attributes` array based on authentication level
3. Update RowCalibur interfaces
4. Handle any necessary data transformations (snake_case ↔ camelCase)
