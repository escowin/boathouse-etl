# Database Schema Relationships

## Overview
This document outlines the complete relationship structure of the Boathouse ETL database, including both the core boathouse management tables and the integrated Rowcalibur competitive system tables.

## Core Entity Types

### Primary Key Strategies
- **UUID Primary Keys**: `athletes`, `boats`, `gauntlets`, `gauntlet_matches`, `ladders`, `ladder_positions`, `ladder_progressions`
- **Auto-increment Integer Primary Keys**: `teams`, `practice_sessions`, `lineups`, `seat_assignments`, `attendance`, `usra_categories`, `mailing_lists`, `regattas`, `regatta_registrations`, `races`, `erg_tests`, `etl_jobs`, `team_memberships`

## Complete Database Relationship Diagram

```mermaid
erDiagram
    %% Core Boathouse Management System
    ATHLETES {
        uuid athlete_id PK
        text name
        text email
        text phone
        enum type
        enum gender
        integer birth_year
        enum sweep_scull
        enum port_starboard
        boolean bow_in_dark
        decimal weight_kg
        integer height_cm
        integer experience_years
        integer usra_age_category_id FK
        text us_rowing_number
        text emergency_contact
        text emergency_contact_phone
        boolean active
        enum competitive_status
        enum retirement_reason
        date retirement_date
        enum ban_reason
        date ban_date
        text ban_notes
        timestamp created_at
        timestamp updated_at
        text etl_source
        timestamp etl_last_sync
    }

    TEAMS {
        integer team_id PK
        text name
        text team_type
        text description
        uuid head_coach_id FK
        uuid[] assistant_coaches
        integer mailing_list_id FK
        timestamp created_at
        timestamp updated_at
    }

    TEAM_MEMBERSHIPS {
        integer membership_id PK
        uuid athlete_id FK
        integer team_id FK
        enum role
        timestamp joined_at
        timestamp left_at
        timestamp created_at
        timestamp updated_at
    }

    BOATS {
        uuid boat_id PK
        text name
        enum type
        enum status
        text description
        decimal min_weight_kg
        decimal max_weight_kg
        text rigging_type
        text notes
        timestamp created_at
        timestamp updated_at
        text etl_source
        timestamp etl_last_sync
    }

    PRACTICE_SESSIONS {
        integer session_id PK
        integer team_id FK
        date date
        time start_time
        time end_time
        enum session_type
        text location
        text notes
        timestamp created_at
        timestamp updated_at
    }

    ATTENDANCE {
        integer attendance_id PK
        integer session_id FK
        uuid athlete_id FK
        enum status
        text notes
        integer team_id FK
        timestamp created_at
        timestamp updated_at
        text etl_source
        timestamp etl_last_sync
    }

    LINEUPS {
        integer lineup_id PK
        integer session_id FK
        uuid boat_id FK
        integer team_id FK
        text lineup_name
        enum lineup_type
        decimal total_weight_kg
        decimal average_weight_kg
        decimal average_age
        text notes
        timestamp created_at
        timestamp updated_at
        text etl_source
        timestamp etl_last_sync
    }

    SEAT_ASSIGNMENTS {
        integer seat_assignment_id PK
        integer lineup_id FK
        uuid athlete_id FK
        integer seat_number
        enum side
        text notes
        timestamp created_at
        timestamp updated_at
        text etl_source
        timestamp etl_last_sync
    }

    USRA_CATEGORIES {
        integer usra_category_id PK
        integer start_age
        integer end_age
        string category
        timestamp created_at
        timestamp updated_at
    }

    MAILING_LISTS {
        integer mailing_list_id PK
        string name
        string email
        text description
        boolean active
        timestamp created_at
        timestamp updated_at
    }

    %% Competition Management System
    REGATTAS {
        integer regatta_id PK
        text name
        text location
        text body_of_water
        date start_date
        date end_date
        date registration_deadline
        boolean registration_open
        text registration_notes
        enum regatta_type
        text notes
        timestamp created_at
        timestamp updated_at
    }

    REGATTA_REGISTRATIONS {
        integer registration_id PK
        integer regatta_id FK
        uuid athlete_id FK
        integer team_id FK
        text event_name
        text boat_class
        text notes
        timestamp created_at
        timestamp updated_at
    }

    RACES {
        integer race_id PK
        integer regatta_id FK
        integer lineup_id FK
        text event_name
        date race_date
        time race_time
        integer distance_meters
        integer result_time_seconds
        integer placement
        integer total_entries
        integer lane_number
        text notes
        timestamp created_at
        timestamp updated_at
    }

    ERG_TESTS {
        integer erg_test_id PK
        uuid athlete_id FK
        date test_date
        integer distance_meters
        integer time_seconds
        decimal split_seconds
        integer stroke_rate
        decimal watts
        text notes
        timestamp created_at
        timestamp updated_at
    }

    %% Rowcalibur Competitive System (Simplified)
    GAUNTLETS {
        uuid gauntlet_id PK
        text name
        text description
        enum boat_type
        uuid created_by FK
        enum status
        timestamp created_at
        timestamp updated_at
    }

    GAUNTLET_MATCHES {
        uuid match_id PK
        uuid gauntlet_id FK
        text workout
        integer sets
        integer user_wins
        integer user_losses
        date match_date
        text notes
        timestamp created_at
        timestamp updated_at
    }

    GAUNTLET_LINEUPS {
        uuid gauntlet_lineup_id PK
        uuid gauntlet_id FK
        uuid match_id FK
        uuid boat_id FK
        timestamp created_at
        timestamp updated_at
    }

    GAUNTLET_SEAT_ASSIGNMENTS {
        uuid gauntlet_seat_assignment_id PK
        uuid gauntlet_lineup_id FK
        uuid athlete_id FK
        integer seat_number
        text side
        text notes
        timestamp created_at
        timestamp updated_at
    }

    LADDERS {
        uuid ladder_id PK
        uuid gauntlet_id FK
        timestamp created_at
        timestamp updated_at
    }

    LADDER_POSITIONS {
        uuid position_id PK
        uuid ladder_id FK
        uuid athlete_id FK
        integer position
        integer previous_position
        integer wins
        integer losses
        integer draws
        decimal win_rate
        integer total_matches
        integer points
        enum streak_type
        integer streak_count
        date last_match_date
        date joined_date
        timestamp last_updated
    }

    LADDER_PROGRESSIONS {
        uuid progression_id PK
        uuid ladder_id FK
        uuid athlete_id FK
        integer from_position
        integer to_position
        integer change
        enum reason
        uuid match_id FK
        text notes
        date date
    }

    %% Core Boathouse Relationships
    ATHLETES ||--o{ TEAM_MEMBERSHIPS : "belongs to"
    TEAMS ||--o{ TEAM_MEMBERSHIPS : "has"
    ATHLETES ||--o{ ATTENDANCE : "attends"
    PRACTICE_SESSIONS ||--o{ ATTENDANCE : "tracks"
    TEAMS ||--o{ ATTENDANCE : "belongs to"
    ATHLETES ||--o{ SEAT_ASSIGNMENTS : "assigned to"
    LINEUPS ||--o{ SEAT_ASSIGNMENTS : "contains"
    ATHLETES ||--o{ REGATTA_REGISTRATIONS : "registers for"
    TEAMS ||--o{ REGATTA_REGISTRATIONS : "registers"
    ATHLETES ||--o{ ERG_TESTS : "performs"
    ATHLETES ||--o{ USRA_CATEGORIES : "categorized by"
    TEAMS ||--o{ MAILING_LISTS : "uses"
    TEAMS ||--o{ PRACTICE_SESSIONS : "schedules"
    TEAMS ||--o{ LINEUPS : "creates"
    BOATS ||--o{ LINEUPS : "used in"
    PRACTICE_SESSIONS ||--o{ LINEUPS : "contains"
    TEAMS ||--o{ ATHLETES : "coached by"
    REGATTAS ||--o{ REGATTA_REGISTRATIONS : "receives"
    REGATTAS ||--o{ RACES : "hosts"
    LINEUPS ||--o{ RACES : "participates in"

    %% Rowcalibur System Relationships (Simplified)
    ATHLETES ||--o{ GAUNTLETS : "creates"
    GAUNTLETS ||--o{ GAUNTLET_MATCHES : "contains"
    GAUNTLETS ||--o{ GAUNTLET_LINEUPS : "has lineups"
    GAUNTLET_MATCHES ||--o{ GAUNTLET_LINEUPS : "has two sides"
    BOATS ||--o{ GAUNTLET_LINEUPS : "used in"
    GAUNTLET_LINEUPS ||--o{ GAUNTLET_SEAT_ASSIGNMENTS : "contains"
    ATHLETES ||--o{ GAUNTLET_SEAT_ASSIGNMENTS : "assigned to"
    GAUNTLETS ||--|| LADDERS : "has one ladder"
    LADDERS ||--o{ LADDER_POSITIONS : "ranks"
    ATHLETES ||--o{ LADDER_POSITIONS : "participates in"
    LADDERS ||--o{ LADDER_PROGRESSIONS : "tracks changes"
    ATHLETES ||--o{ LADDER_PROGRESSIONS : "moves in"
    GAUNTLET_MATCHES ||--o{ LADDER_PROGRESSIONS : "causes changes"
```

## Core Boathouse Management System

### 1. Athlete Management
```
athletes (UUID) ←→ team_memberships ←→ teams (INTEGER)
athletes (UUID) ←→ usra_categories (INTEGER)
athletes (UUID) ←→ attendance (INTEGER)
athletes (UUID) ←→ seat_assignments (INTEGER)
athletes (UUID) ←→ regatta_registrations (INTEGER)
athletes (UUID) ←→ erg_tests (INTEGER)
athletes (UUID) ←→ teams (head_coach_id)
```

**Key Relationships:**
- **Many-to-Many**: Athletes ↔ Teams (through TeamMembership)
- **One-to-Many**: Athletes → Attendance records
- **One-to-Many**: Athletes → SeatAssignments
- **One-to-Many**: Athletes → RegattaRegistrations
- **One-to-Many**: Athletes → ErgTests
- **One-to-Many**: Athletes → Teams (as head coach)

### 2. Team Management
```
teams (INTEGER) ←→ team_memberships ←→ athletes (UUID)
teams (INTEGER) ←→ practice_sessions (INTEGER)
teams (INTEGER) ←→ lineups (INTEGER)
teams (INTEGER) ←→ attendance (INTEGER)
teams (INTEGER) ←→ regatta_registrations (INTEGER)
teams (INTEGER) ←→ mailing_lists (INTEGER)
teams (INTEGER) ←→ athletes (head_coach_id)
```

**Key Relationships:**
- **Many-to-Many**: Teams ↔ Athletes (through TeamMembership)
- **One-to-Many**: Teams → PracticeSessions
- **One-to-Many**: Teams → Lineups
- **One-to-Many**: Teams → Attendance records
- **One-to-Many**: Teams → RegattaRegistrations
- **Many-to-One**: Teams → MailingList

### 3. Practice & Session Management
```
practice_sessions (INTEGER) ←→ teams (INTEGER)
practice_sessions (INTEGER) ←→ attendance (INTEGER)
practice_sessions (INTEGER) ←→ lineups (INTEGER)
```

**Key Relationships:**
- **Many-to-One**: PracticeSessions → Teams
- **One-to-Many**: PracticeSessions → Attendance records
- **One-to-Many**: PracticeSessions → Lineups

### 4. Boat & Lineup Management
```
boats (UUID) ←→ lineups (INTEGER)
lineups (INTEGER) ←→ practice_sessions (INTEGER)
lineups (INTEGER) ←→ teams (INTEGER)
lineups (INTEGER) ←→ seat_assignments (INTEGER)
lineups (INTEGER) ←→ races (INTEGER)
lineups (INTEGER) ←→ gauntlet_matches (UUID) [OPTIONAL]
```

**Key Relationships:**
- **One-to-Many**: Boats → Lineups
- **Many-to-One**: Lineups → PracticeSessions
- **Many-to-One**: Lineups → Teams
- **One-to-Many**: Lineups → SeatAssignments
- **One-to-Many**: Lineups → Races
- **One-to-Many**: Lineups → GauntletMatches (optional)

### 5. Competition Management
```
regattas (INTEGER) ←→ regatta_registrations (INTEGER)
regattas (INTEGER) ←→ races (INTEGER)
regatta_registrations (INTEGER) ←→ athletes (UUID)
regatta_registrations (INTEGER) ←→ teams (INTEGER)
races (INTEGER) ←→ lineups (INTEGER)
```

**Key Relationships:**
- **One-to-Many**: Regattas → RegattaRegistrations
- **One-to-Many**: Regattas → Races
- **Many-to-One**: RegattaRegistrations → Athletes
- **Many-to-One**: RegattaRegistrations → Teams
- **Many-to-One**: Races → Lineups

## Rowcalibur Competitive System Integration (Simplified Design)

### Design Philosophy
The Rowcalibur competitive system has been simplified to provide a clean, single-point-of-control architecture:

- **Single Point of Control**: Gauntlet is the primary entity - creation and deletion manages all related data
- **Minimal Configuration**: Removed complex configuration objects in favor of simple relational structure  
- **CASCADE Deletes**: When a gauntlet is deleted, all related data is automatically removed
- **1:1 Relationship**: Each gauntlet has exactly one ladder (auto-created)
- **No Redundancy**: Eliminated duplicate fields between gauntlets and ladders

### CASCADE Delete Chain
```
DELETE gauntlet → CASCADE deletes:
├── gauntlet_lineups
│   └── gauntlet_seat_assignments
├── gauntlet_matches
│   └── ladder_progressions (via match_id)
└── ladders
    ├── ladder_positions
    └── ladder_progressions (via ladder_id)
```

### 6. Gauntlet System
```
athletes (UUID) ←→ gauntlets (UUID) [created_by]
gauntlets (UUID) ←→ gauntlet_matches (UUID) [CASCADE]
gauntlets (UUID) ←→ gauntlet_lineups (UUID) [CASCADE]
gauntlet_matches (UUID) ←→ gauntlet_lineups (UUID) [2 per match, SET NULL]
gauntlet_lineups (UUID) ←→ gauntlet_seat_assignments (UUID) [CASCADE]
boats (UUID) ←→ gauntlet_lineups (UUID)
athletes (UUID) ←→ gauntlet_seat_assignments (UUID) [CASCADE]
gauntlet_matches (UUID) ←→ ladder_progressions (UUID) [CASCADE]
```

**Key Relationships:**
- **One-to-Many**: Athletes → Gauntlets (as creator)
- **One-to-Many**: Gauntlets → GauntletMatches
- **One-to-Many**: GauntletMatches → GauntletLineups (exactly 2 per match: user & challenger)
- **One-to-Many**: GauntletLineups → GauntletSeatAssignments
- **One-to-Many**: Boats → GauntletLineups
- **Many-to-One**: GauntletLineups → Teams (optional team context)
- **One-to-Many**: Athletes → GauntletSeatAssignments
- **One-to-Many**: GauntletMatches → LadderProgressions (optional)

### 7. Ladder System
```
gauntlets (UUID) ←→ ladders (UUID) [1:1, CASCADE]
ladders (UUID) ←→ ladder_positions (UUID) [CASCADE]
ladders (UUID) ←→ ladder_progressions (UUID) [CASCADE]
athletes (UUID) ←→ ladder_positions (UUID) [CASCADE]
athletes (UUID) ←→ ladder_progressions (UUID) [CASCADE]
gauntlet_matches (UUID) ←→ ladder_progressions (UUID) [CASCADE]
```

**Key Relationships:**
- **One-to-One**: Gauntlets → Ladders (auto-created, CASCADE)
- **One-to-Many**: Ladders → LadderPositions
- **One-to-Many**: Ladders → LadderProgressions
- **One-to-Many**: Athletes → LadderPositions
- **One-to-Many**: Athletes → LadderProgressions
- **Many-to-One**: LadderProgressions → GauntletMatches (optional)

## Cross-System Integration Points

### 8. Athlete-Centric Integration
The `athletes` table serves as the central hub connecting both systems:
- **Boathouse System**: Team memberships, attendance, seat assignments, regatta registrations, erg tests
- **Rowcalibur System**: Gauntlet creation, ladder participation, competitive match tracking

### 9. Gauntlet Lineup System
The new `gauntlet_lineups` and `gauntlet_seat_assignments` tables provide proper two-side match structure:
- **Two-Side Matches**: Each gauntlet match has exactly two lineups (user & challenger)
- **Independent Structure**: Gauntlet lineups are separate from practice session lineups
- **Proper Seat Assignments**: Each lineup has detailed seat assignments with athlete positions
- **Boat Integration**: Each lineup references a specific boat
- **Team Context**: Optional team context for organizational purposes

### 10. Team Context
Teams provide organizational context for both systems:
- **Boathouse System**: Practice sessions, lineups, attendance tracking
- **Rowcalibur System**: Gauntlets and ladders can be team-specific through athlete team memberships

## Data Flow Patterns

### 11. Practice Session Workflow
```
Team → PracticeSession → Attendance (per Athlete)
Team → PracticeSession → Lineup → SeatAssignment (per Athlete)
```

### 12. Competition Workflow
```
Regatta → Race → Lineup (optional)
Athlete → RegattaRegistration → Regatta
```

### 13. Rowcalibur Competitive Workflow (Simplified)
```
Athlete → Gauntlet → Ladder (auto-created)
Athlete → Gauntlet → GauntletMatch → GauntletLineup (2 per match) → GauntletSeatAssignment
Athlete → GauntletMatch → LadderProgression (optional)
Athlete → Ladder → LadderPosition → LadderProgression
```

## Key Design Decisions

### 14. UUID vs Integer Primary Keys
- **UUID Tables**: Athletes, Boats, and all Rowcalibur tables (offline-first compatibility)
- **Integer Tables**: Core boathouse management tables (ETL from Google Sheets)

### 15. Two-Side Match Structure
- **GauntletMatch → GauntletLineup**: Each match has exactly 2 lineups (user & challenger sides)
- **GauntletLineup → GauntletSeatAssignment**: Each lineup has detailed seat assignments
- **LadderProgression → GauntletMatch**: Tracks which matches caused ladder movements

### 16. Cross-Reference Strategy
- **Athlete-Centric**: All competitive activities tie back to athletes
- **Team-Context**: Team memberships provide organizational structure
- **Independent Gauntlet System**: Gauntlet lineups are separate from practice session lineups

## Query Patterns

### 17. Common Joins
```sql
-- Athlete with team memberships and competitive activities
SELECT a.*, tm.role, g.name as gauntlet_name, lp.position
FROM athletes a
LEFT JOIN team_memberships tm ON a.athlete_id = tm.athlete_id
LEFT JOIN gauntlets g ON a.athlete_id = g.created_by
LEFT JOIN ladder_positions lp ON a.athlete_id = lp.athlete_id;

-- Gauntlet match with both lineups and seat assignments
SELECT 
    gm.match_id,
    gm.workout,
    gl.side,
    gl.lineup_name,
    a.name as athlete_name,
    gsa.seat_number,
    gsa.side as seat_side
FROM gauntlet_matches gm
JOIN gauntlet_lineups gl ON gm.match_id = gl.match_id
JOIN gauntlet_seat_assignments gsa ON gl.gauntlet_lineup_id = gsa.gauntlet_lineup_id
JOIN athletes a ON gsa.athlete_id = a.athlete_id
WHERE gm.match_id = 'match-uuid'
ORDER BY gl.side, gsa.seat_number;
```

### 18. Performance Considerations
- **Indexes**: All foreign key relationships are indexed
- **Unique Constraints**: Prevent duplicate memberships and attendance records
- **Cascade Deletes**: Maintain referential integrity on team/session deletions

This relationship structure provides a flexible foundation for both traditional boathouse management and competitive rowing systems while maintaining data integrity and supporting offline-first operations.
