# Multi-Team Boathouse Database Schema

## Overview

This schema extends the single-team design to support multiple teams within a boathouse (Mens Masters, Juniors Rec, Juniors Varsity, Babs, etc.) while maintaining shared resources and cross-team capabilities.

## Core Multi-Team Tables

### 1. Athletes Table
Based on your current Google Sheets athlete data structure:

```sql
CREATE TABLE athletes (
    athlete_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    
    -- Rowing Profile
    type TEXT NOT NULL CHECK (type IN ('Cox', 'Rower', 'Rower & Coxswain')),
    gender CHAR(1) CHECK (gender IN ('M', 'F')),
    birth_year INTEGER,
    
    -- Rowing Skills & Preferences
    sweep_scull TEXT CHECK (sweep_scull IN ('Sweep', 'Scull', 'Sweep & Scull')),
    port_starboard TEXT CHECK (port_starboard IN ('Starboard', 'Prefer Starboard', 'Either', 'Prefer Port', 'Port')),
    bow_in_dark BOOLEAN,
    
    -- Physical Attributes
    weight_kg DECIMAL(5,2),
    height_cm INTEGER,
    
    -- Experience & Categories
    experience_years INTEGER,
    usra_age_category_id INTEGER REFERENCES usra_categories(usra_category_id),
    us_rowing_number TEXT,
    
    -- Emergency Contact
    emergency_contact TEXT,
    emergency_contact_phone TEXT,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    etl_source TEXT DEFAULT 'google_sheets',
    etl_last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_athletes_name ON athletes(name);
CREATE INDEX idx_athletes_type ON athletes(type);
CREATE INDEX idx_athletes_active ON athletes(active);
CREATE INDEX idx_athletes_weight ON athletes(weight_kg);
```

### 2. Boats Table
Enhanced from your current boat structure:

```sql
CREATE TABLE boats (
    boat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('Single', 'Double', 'Pair', 'Quad', 'Four', 'Eight')),
    status TEXT DEFAULT 'Available' CHECK (status IN ('Available', 'Reserved', 'In Use', 'Maintenance', 'Retired')),
    
    -- Physical Specifications
    description TEXT,
    min_weight_kg DECIMAL(5,2),
    max_weight_kg DECIMAL(5,2),
    rigging_type TEXT,
    
    -- Additional Details
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    etl_source TEXT DEFAULT 'google_sheets',
    etl_last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_boats_name ON boats(name);
CREATE INDEX idx_boats_type ON boats(type);
CREATE INDEX idx_boats_status ON boats(status);
```

### 3. Teams Table
Define all teams within the boathouse:

```sql
CREATE TABLE teams (
    team_id SERIAL PRIMARY KEY,
    
    -- Team Information
    name TEXT NOT NULL, -- e.g., "Mens Masters", "Juniors Varsity"
    team_type TEXT,
    description TEXT,
    
    -- Team Management
    head_coach_id UUID REFERENCES athletes(athlete_id), -- Coach can be an athlete
    assistant_coaches UUID[], -- Array of coach athlete IDs
    mailing_list_id INTEGER REFERENCES mailing_lists(mailing_list_id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_teams_name ON teams(name);
CREATE INDEX idx_teams_team_type ON teams(team_type);
CREATE INDEX idx_teams_mailing_list_id ON teams(mailing_list_id);
```

### 4. Team Memberships Table
Track which athletes belong to which teams with different roles:

```sql
CREATE TABLE team_memberships (
    membership_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    
    -- Membership Details
    role TEXT DEFAULT 'Athlete' CHECK (role IN ('Athlete', 'Captain', 'Coach', 'Assistant Coach', 'Secretary')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP, -- NULL for current membership
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one membership per athlete per team
    UNIQUE(team_id, athlete_id)
);

-- Indexes
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_athlete_id ON team_memberships(athlete_id);
CREATE INDEX idx_team_memberships_role ON team_memberships(role);
```

**Multi-Role Support:**
An athlete can have different roles across different teams. For example:
- **John Smith**: Athlete in "Mens Masters" + Coach in "Junior Boys Varsity"
- **Sarah Johnson**: Captain in "Womens Masters" + Assistant Coach in "Junior Girls Rec"
- **Mike Davis**: Athlete in "Mens Masters" + Secretary in "Mens Masters" (dual role)

### 5. Enhanced Practice Sessions Table
Add team context to practice sessions:

```sql
CREATE TABLE practice_sessions (
    session_id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(team_id) ON DELETE CASCADE,
    
    -- Session Details
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location TEXT,
    session_type TEXT NOT NULL DEFAULT 'Practice' CHECK (session_type IN ('Practice', 'Race', 'Erg Test', 'Meeting', 'Other')),
    
    -- Additional Information
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_practice_sessions_team_id ON practice_sessions(team_id);
CREATE INDEX idx_practice_sessions_date ON practice_sessions(date);
CREATE INDEX idx_practice_sessions_team_date ON practice_sessions(team_id, date);
```

### 6. Enhanced Attendance Table
Team-specific attendance tracking:

```sql
CREATE TABLE attendance (
    attendance_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES practice_sessions(session_id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    
    -- Attendance Status
    status TEXT CHECK (status IN ('Yes', 'No', 'Maybe', 'Late', 'Excused')),
    notes TEXT,
    
    -- Team Context (denormalized for performance)
    team_id INTEGER REFERENCES teams(team_id),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    etl_source TEXT DEFAULT 'google_sheets',
    etl_last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one record per athlete per session
    UNIQUE(session_id, athlete_id)
);

-- Indexes
CREATE INDEX idx_attendance_session_id ON attendance(session_id);
CREATE INDEX idx_attendance_athlete_id ON attendance(athlete_id);
CREATE INDEX idx_attendance_team_id ON attendance(team_id);
CREATE INDEX idx_attendance_status ON attendance(status);
```

### 7. Enhanced Lineups Table
Team-specific lineup management:

```sql
CREATE TABLE lineups (
    lineup_id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES practice_sessions(session_id) ON DELETE CASCADE,
    boat_id UUID REFERENCES boats(boat_id) ON DELETE CASCADE,
    
    -- Team Context
    team_id INTEGER REFERENCES teams(team_id),
    
    -- Lineup Details
    lineup_name TEXT, -- e.g., "Varsity 8+", "Novice 4+"
    lineup_type TEXT NOT NULL CHECK (lineup_type IN ('Practice', 'Race', 'Test')),
    
    -- Performance Metrics
    total_weight_kg DECIMAL(6,2),
    average_weight_kg DECIMAL(5,2),
    average_age DECIMAL(4,1),
    
    -- Additional Information
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    etl_source TEXT DEFAULT 'google_sheets',
    etl_last_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_lineups_session_id ON lineups(session_id);
CREATE INDEX idx_lineups_boat_id ON lineups(boat_id);
CREATE INDEX idx_lineups_team_id ON lineups(team_id);
```

### 8. Enhanced Regatta Registrations Table
Team-specific regatta participation:

```sql
CREATE TABLE regatta_registrations (
    registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID REFERENCES regattas(regatta_id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(team_id), -- Primary team for this regatta
    
    -- Registration Status
    status TEXT NOT NULL CHECK (status IN ('Interested', 'Committed', 'Declined', 'Waitlisted')),
    
    -- Athlete Preferences
    preferred_events TEXT[], -- Array of event names
    availability_notes TEXT,
    
    -- Coach Management
    coach_notes TEXT,
    coach_approved BOOLEAN DEFAULT false,
    
    -- Registration Timeline
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    coach_reviewed_at TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one registration per athlete per regatta
    UNIQUE(regatta_id, athlete_id)
);

-- Indexes
CREATE INDEX idx_regatta_registrations_regatta_id ON regatta_registrations(regatta_id);
CREATE INDEX idx_regatta_registrations_athlete_id ON regatta_registrations(athlete_id);
CREATE INDEX idx_regatta_registrations_team_id ON regatta_registrations(team_id);
CREATE INDEX idx_regatta_registrations_status ON regatta_registrations(status);
```

### 9. Seat Assignments Table
Detailed seat assignments within lineups:

```sql
CREATE TABLE seat_assignments (
    seat_assignment_id SERIAL PRIMARY KEY,
    lineup_id INTEGER REFERENCES lineups(lineup_id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    
    -- Seat Information
    seat_number INTEGER NOT NULL,
    side TEXT CHECK (side IN ('Port', 'Starboard')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure one athlete per seat per lineup
    UNIQUE(lineup_id, seat_number)
);

-- Indexes
CREATE INDEX idx_seat_assignments_lineup_id ON seat_assignments(lineup_id);
CREATE INDEX idx_seat_assignments_athlete_id ON seat_assignments(athlete_id);
```

**Seat Number Logic:**
- **Bow**: Always seat 1
- **Coxswain**: Seat 5 (in 4+) or seat 9 (in 8+)
- **Stroke**: Last rowing seat (seat 4 in 4+, seat 8 in 8+)
- **Other seats**: 2, 3, 6, 7 (in 8+) or 2, 3 (in 4+)

Seat names are derived from seat numbers and boat type in the application layer.

### 10. Regattas Table
For tracking competitions:

```sql
CREATE TABLE regattas (
    regatta_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL,
    location TEXT,
    body_of_water TEXT,
    
    -- Dates
    start_date DATE,
    end_date DATE,
    registration_deadline DATE,
    
    -- Registration Management
    registration_open BOOLEAN DEFAULT true,
    registration_notes TEXT,
    
    -- Additional Details
    regatta_type TEXT CHECK (regatta_type IN ('Local', 'Regional', 'National', 'International')),
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_regattas_name ON regattas(name);
CREATE INDEX idx_regattas_start_date ON regattas(start_date);
CREATE INDEX idx_regattas_registration_open ON regattas(registration_open);
```

### 11. Races Table
Individual race events within regattas:

```sql
CREATE TABLE races (
    race_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    regatta_id UUID REFERENCES regattas(regatta_id) ON DELETE CASCADE,
    lineup_id UUID REFERENCES lineups(lineup_id),
    
    -- Race Details
    event_name TEXT NOT NULL, -- e.g., "Men's 8+ Heat 1"
    race_date DATE,
    race_time TIME,
    distance_meters INTEGER DEFAULT 2000,
    
    -- Results
    result_time_seconds INTEGER,
    placement INTEGER,
    total_entries INTEGER,
    
    -- Additional Information
    lane_number INTEGER,
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_races_regatta_id ON races(regatta_id);
CREATE INDEX idx_races_lineup_id ON races(lineup_id);
CREATE INDEX idx_races_race_date ON races(race_date);
```

### 12. Erg Tests Table
For tracking performance tests:

```sql
CREATE TABLE erg_tests (
    test_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID REFERENCES athletes(athlete_id) ON DELETE CASCADE,
    
    -- Test Details
    test_date DATE NOT NULL,
    test_type TEXT NOT NULL CHECK (test_type IN ('2K', '5K', '1K', '6K', '10K', '30min', '1hour')),
    distance_meters INTEGER,
    time_seconds INTEGER,
    
    -- Performance Metrics
    split_seconds DECIMAL(5,2),
    watts DECIMAL(6,2),
    calories INTEGER,
    
    -- Additional Information
    notes TEXT,
    test_conditions TEXT, -- e.g., "Indoor", "Outdoor", "Hot", "Cold"
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_erg_tests_athlete_id ON erg_tests(athlete_id);
CREATE INDEX idx_erg_tests_test_date ON erg_tests(test_date);
CREATE INDEX idx_erg_tests_test_type ON erg_tests(test_type);
```

### 13. USRA Categories Table
For age category management:

```sql
CREATE TABLE usra_categories (
    usra_category_id SERIAL PRIMARY KEY,
    
    -- Category Details
    start_age INTEGER NOT NULL,
    end_age INTEGER NOT NULL,
    category TEXT NOT NULL,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_usra_categories_unique ON usra_categories(start_age, end_age, category);
CREATE INDEX idx_usra_categories_start_age ON usra_categories(start_age);
CREATE INDEX idx_usra_categories_end_age ON usra_categories(end_age);
```

### 14. Mailing Lists Table
For team communication management:

```sql
CREATE TABLE mailing_lists (
    mailing_list_id SERIAL PRIMARY KEY,
    
    -- Mailing List Details
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    description TEXT,
    
    -- Status
    active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE UNIQUE INDEX idx_mailing_lists_email ON mailing_lists(email);
CREATE INDEX idx_mailing_lists_name ON mailing_lists(name);
CREATE INDEX idx_mailing_lists_active ON mailing_lists(active);
```

### 15. Gauntlet System Tables
For Rowcalibur's competitive system:

```sql
CREATE TABLE gauntlets (
    gauntlet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Gauntlet Details
    name TEXT NOT NULL,
    description TEXT,
    boat_type TEXT NOT NULL,
    created_by UUID REFERENCES athletes(athlete_id),
    
    -- Status
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Completed', 'Cancelled')),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gauntlet_matches (
    match_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gauntlet_id UUID REFERENCES gauntlets(gauntlet_id) ON DELETE CASCADE,
    
    -- Match Details
    match_date DATE NOT NULL,
    challenger_lineup_id UUID REFERENCES lineups(lineup_id),
    defender_lineup_id UUID REFERENCES lineups(lineup_id),
    
    -- Results
    winner_lineup_id UUID REFERENCES lineups(lineup_id),
    match_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_gauntlet_matches_gauntlet_id ON gauntlet_matches(gauntlet_id);
CREATE INDEX idx_gauntlet_matches_match_date ON gauntlet_matches(match_date);
```

### 16. ETL Jobs Tracking Table
For monitoring data synchronization:

```sql
CREATE TABLE etl_jobs (
    job_id SERIAL PRIMARY KEY,
    
    -- Job Details
    job_type TEXT NOT NULL CHECK (job_type IN ('full_etl', 'incremental_etl', 'athletes_sync', 'boats_sync', 'attendance_sync')),
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    
    -- Timing
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Statistics
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    
    -- Error Handling
    error_message TEXT,
    error_details JSONB,
    
    -- Additional Information
    metadata JSONB,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_etl_jobs_status ON etl_jobs(status);
CREATE INDEX idx_etl_jobs_started_at ON etl_jobs(started_at);
CREATE INDEX idx_etl_jobs_job_type ON etl_jobs(job_type);
```

## Boat Reservation System

### 17. Boat Reservations Table
Track boat usage across teams:

```sql
CREATE TABLE boat_reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boat_id UUID REFERENCES boats(boat_id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(team_id) ON DELETE CASCADE,
    
    -- Reservation Details
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    
    -- Reservation Context
    session_id UUID REFERENCES practice_sessions(session_id),
    lineup_id UUID REFERENCES lineups(lineup_id),
    
    -- Reservation Status
    status TEXT DEFAULT 'Reserved' CHECK (status IN ('Reserved', 'In Use', 'Completed', 'Cancelled')),
    
    -- Additional Information
    notes TEXT,
    reserved_by UUID REFERENCES athletes(athlete_id), -- Who made the reservation
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_boat_reservations_boat_id ON boat_reservations(boat_id);
CREATE INDEX idx_boat_reservations_team_id ON boat_reservations(team_id);
CREATE INDEX idx_boat_reservations_date ON boat_reservations(reservation_date);
CREATE INDEX idx_boat_reservations_boat_date ON boat_reservations(boat_id, reservation_date);
```

## Business Logic Implementation

### **Multi-Team Practice Access**

```javascript
// Get practice sessions for all teams an athlete belongs to
async function getAthletePracticeSessions(athleteId, dateRange) {
  // First, get all teams the athlete belongs to (any role)
  const athleteTeams = await TeamMembership.findAll({
    where: {
      athlete_id: athleteId,
      active: true
    },
    include: [{ model: Team }]
  });
  
  const teamIds = athleteTeams.map(membership => membership.team_id);
  
  // Get practice sessions for all their teams
  return await PracticeSession.findAll({
    where: {
      team_id: {
        [Sequelize.Op.in]: teamIds
      },
      date: {
        [Sequelize.Op.between]: dateRange
      }
    },
    include: [
      { 
        model: Team,
        attributes: ['name', 'display_name', 'team_type']
      },
      { 
        model: Attendance, 
        include: [Athlete],
        where: { athlete_id: athleteId },
        required: false // LEFT JOIN to include sessions even without attendance record
      },
      { 
        model: Lineup, 
        include: [Boat] 
      }
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });
}

// Get practice sessions with role context
async function getAthletePracticeSessionsWithRoles(athleteId, dateRange) {
  const athleteTeams = await TeamMembership.findAll({
    where: {
      athlete_id: athleteId,
      active: true
    },
    include: [{ model: Team }]
  });
  
  const teamIds = athleteTeams.map(membership => membership.team_id);
  const teamRoles = athleteTeams.reduce((acc, membership) => {
    acc[membership.team_id] = membership.role;
    return acc;
  }, {});
  
  const sessions = await PracticeSession.findAll({
    where: {
      team_id: {
        [Sequelize.Op.in]: teamIds
      },
      date: {
        [Sequelize.Op.between]: dateRange
      }
    },
    include: [
      { 
        model: Team,
        attributes: ['name', 'display_name', 'team_type']
      },
      { 
        model: Attendance, 
        include: [Athlete],
        where: { athlete_id: athleteId },
        required: false
      },
      { 
        model: Lineup, 
        include: [Boat] 
      }
    ],
    order: [['date', 'ASC'], ['start_time', 'ASC']]
  });
  
  // Add role context to each session
  return sessions.map(session => ({
    ...session.toJSON(),
    athlete_role: teamRoles[session.team_id],
    can_manage: ['Coach', 'Assistant Coach', 'Captain'].includes(teamRoles[session.team_id])
  }));
}

// Single team practice sessions (for team-specific views)
async function getTeamPracticeSessions(teamId, dateRange) {
  return await PracticeSession.findAll({
    where: {
      team_id: teamId,
      date: {
        [Sequelize.Op.between]: dateRange
      }
    },
    include: [
      { model: Team },
      { model: Attendance, include: [Athlete] },
      { model: Lineup, include: [Boat] }
    ]
  });
}
```

### **Frontend Filtering Logic**

```javascript
// Example React component logic
function PracticeSessionsView({ athleteId }) {
  const [sessions, setSessions] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [athleteTeams, setAthleteTeams] = useState([]);
  
  useEffect(() => {
    // Get athlete's teams and practice sessions
    Promise.all([
      getAthleteTeams(athleteId),
      getAthletePracticeSessionsWithRoles(athleteId, dateRange)
    ]).then(([teams, practiceSessions]) => {
      setAthleteTeams(teams);
      setSessions(practiceSessions);
    });
  }, [athleteId]);
  
  // Filter sessions based on selected team
  const filteredSessions = selectedTeam === 'all' 
    ? sessions 
    : sessions.filter(session => session.team_id === selectedTeam);
  
  return (
    <div>
      {/* Team filter dropdown */}
      <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
        <option value="all">All My Teams</option>
        {athleteTeams.map(team => (
          <option key={team.team_id} value={team.team_id}>
            {team.Team.display_name} ({team.role})
          </option>
        ))}
      </select>
      
      {/* Practice sessions list */}
      {filteredSessions.map(session => (
        <div key={session.session_id} className="practice-session">
          <h3>{session.Team.display_name} - {session.session_name}</h3>
          <p>Date: {session.date} | Time: {session.start_time}</p>
          <p>My Role: {session.athlete_role}</p>
          {session.can_manage && (
            <button>Manage Session</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### **Boat Reservation Logic**

```javascript
// Check boat availability across teams
async function checkBoatAvailability(boatId, date, startTime, endTime, excludeTeamId = null) {
  const reservations = await BoatReservation.findAll({
    where: {
      boat_id: boatId,
      reservation_date: date,
      status: ['Reserved', 'In Use'],
      [Sequelize.Op.or]: [
        {
          start_time: { [Sequelize.Op.lte]: endTime },
          end_time: { [Sequelize.Op.gte]: startTime }
        }
      ]
    }
  });
  
  // Filter out reservations from the same team (for modifications)
  const conflictingReservations = reservations.filter(r => 
    excludeTeamId ? r.team_id !== excludeTeamId : true
  );
  
  return conflictingReservations.length === 0;
}

// Create boat reservation
async function createBoatReservation(boatId, teamId, date, startTime, endTime, sessionId = null) {
  const isAvailable = await checkBoatAvailability(boatId, date, startTime, endTime);
  
  if (!isAvailable) {
    throw new Error('Boat is not available during the requested time');
  }
  
  return await BoatReservation.create({
    boat_id: boatId,
    team_id: teamId,
    reservation_date: date,
    start_time: startTime,
    end_time: endTime,
    session_id: sessionId,
    status: 'Reserved'
  });
}
```

## Key Benefits of Multi-Team Design

### **1. Shared Resources with Team Isolation**
- **Boats**: Shared across teams with reservation system
- **Athletes**: Can belong to multiple teams
- **Facilities**: Shared practice times and locations
- **Data**: Team-specific views with cross-team analytics

### **2. Flexible Team Management**
- **Dynamic Teams**: Athletes can move between teams
- **Multiple Roles**: Athletes can be athletes on one team, coaches on another
- **Team Evolution**: Teams can be created, modified, or retired
- **Cross-Team Events**: Support for inter-team competitions

### **3. Comprehensive Boat Management**
- **Reservation System**: Prevents double-booking across teams
- **Usage Tracking**: Monitor boat utilization by team
- **Maintenance Scheduling**: Coordinate maintenance across team schedules
- **Performance Analytics**: Compare boat usage patterns

### **4. Enhanced Analytics**
- **Team Performance**: Compare performance across teams
- **Resource Utilization**: Optimize boat and facility usage
- **Cross-Team Insights**: Identify trends across the boathouse
- **Capacity Planning**: Plan for growth and resource needs

## Multi-Role Management

### **Sequelize Implementation for Multi-Role Athletes**

```javascript
// Get all roles for a specific athlete
async function getAthleteRoles(athleteId) {
  return await TeamMembership.findAll({
    where: { 
      athlete_id: athleteId,
      active: true 
    },
    include: [
      { 
        model: Team,
        attributes: ['name', 'display_name', 'team_type']
      }
    ],
    order: [['role', 'ASC']]
  });
}

// Get all coaches across all teams
async function getAllCoaches() {
  return await TeamMembership.findAll({
    where: { 
      role: ['Coach', 'Assistant Coach'],
      active: true 
    },
    include: [
      { 
        model: Athlete,
        attributes: ['name', 'email', 'phone']
      },
      { 
        model: Team,
        attributes: ['name', 'display_name']
      }
    ]
  });
}

// Get athletes who are both athletes and coaches
async function getAthleteCoaches() {
  return await Athlete.findAll({
    include: [
      {
        model: TeamMembership,
        where: { 
          role: 'Athlete',
          active: true 
        },
        include: [{ model: Team }]
      },
      {
        model: TeamMembership,
        where: { 
          role: ['Coach', 'Assistant Coach'],
          active: true 
        },
        include: [{ model: Team }],
        required: true // INNER JOIN to ensure they have both roles
      }
    ]
  });
}

// Create multi-role membership
async function createMultiRoleMembership(athleteId, teamId, role) {
  // Check if athlete already has a role in this team
  const existingMembership = await TeamMembership.findOne({
    where: {
      athlete_id: athleteId,
      team_id: teamId,
      active: true
    }
  });
  
  if (existingMembership) {
    throw new Error('Athlete already has an active role in this team');
  }
  
  return await TeamMembership.create({
    athlete_id: athleteId,
    team_id: teamId,
    role: role,
    start_date: new Date()
  });
}
```

### **Role-Based Access Control**

```javascript
// Check if athlete has coaching privileges for a team
async function canCoachTeam(athleteId, teamId) {
  const membership = await TeamMembership.findOne({
    where: {
      athlete_id: athleteId,
      team_id: teamId,
      role: ['Coach', 'Assistant Coach'],
      active: true
    }
  });
  
  return !!membership;
}

// Get teams where athlete has specific role
async function getTeamsByRole(athleteId, role) {
  return await TeamMembership.findAll({
    where: {
      athlete_id: athleteId,
      role: role,
      active: true
    },
    include: [{ model: Team }]
  });
}

// Validate lineup creation permissions
async function canCreateLineup(athleteId, teamId) {
  const membership = await TeamMembership.findOne({
    where: {
      athlete_id: athleteId,
      team_id: teamId,
      role: ['Coach', 'Assistant Coach', 'Captain'],
      active: true
    }
  });
  
  return !!membership;
}
```

## Example Queries

### Get practice sessions for multi-role athlete:
```sql
-- Get all practice sessions for an athlete across all their teams
SELECT ps.session_id, ps.date, ps.start_time, ps.end_time, ps.session_name,
       t.name as team_name, t.display_name, tm.role as athlete_role,
       att.status as attendance_status
FROM practice_sessions ps
JOIN teams t ON ps.team_id = t.team_id
JOIN team_memberships tm ON t.team_id = tm.team_id
LEFT JOIN attendance att ON ps.session_id = att.session_id AND tm.athlete_id = att.athlete_id
WHERE tm.athlete_id = 'athlete-uuid-here'
  AND tm.active = true
  AND ps.date >= CURRENT_DATE
ORDER BY ps.date, ps.start_time, t.name;
```

### Get athlete's roles across all teams:
```sql
SELECT a.name as athlete_name, t.name as team_name, tm.role, tm.start_date
FROM athletes a
JOIN team_memberships tm ON a.athlete_id = tm.athlete_id
JOIN teams t ON tm.team_id = t.team_id
WHERE a.athlete_id = 'athlete-uuid-here'
  AND tm.active = true
ORDER BY t.name, tm.role;
```

### Get all coaches and their teams:
```sql
SELECT a.name as coach_name, t.name as team_name, tm.role,
       a.email, a.phone
FROM athletes a
JOIN team_memberships tm ON a.athlete_id = tm.athlete_id
JOIN teams t ON tm.team_id = t.team_id
WHERE tm.role IN ('Coach', 'Assistant Coach')
  AND tm.active = true
ORDER BY t.name, tm.role, a.name;
```

### Get athletes who are both athletes and coaches:
```sql
SELECT a.name as athlete_name,
       athlete_teams.team_name as athlete_team,
       coach_teams.team_name as coach_team,
       coach_teams.role as coaching_role
FROM athletes a
JOIN (
    SELECT tm.athlete_id, t.name as team_name
    FROM team_memberships tm
    JOIN teams t ON tm.team_id = t.team_id
    WHERE tm.role = 'Athlete' AND tm.active = true
) athlete_teams ON a.athlete_id = athlete_teams.athlete_id
JOIN (
    SELECT tm.athlete_id, t.name as team_name, tm.role
    FROM team_memberships tm
    JOIN teams t ON tm.team_id = t.team_id
    WHERE tm.role IN ('Coach', 'Assistant Coach') AND tm.active = true
) coach_teams ON a.athlete_id = coach_teams.athlete_id
ORDER BY a.name;
```

### Get team practice schedule:
```sql
SELECT ps.date, ps.start_time, ps.end_time, ps.session_name, ps.focus_area,
       COUNT(a.athlete_id) as attending_count
FROM practice_sessions ps
LEFT JOIN attendance a ON ps.session_id = a.session_id AND a.status = 'Yes'
WHERE ps.team_id = 'team-uuid-here'
  AND ps.date >= CURRENT_DATE
GROUP BY ps.session_id, ps.date, ps.start_time, ps.end_time, ps.session_name, ps.focus_area
ORDER BY ps.date, ps.start_time;
```

### Get boat availability for a team:
```sql
SELECT b.name, b.type, br.reservation_date, br.start_time, br.end_time,
       t.name as team_name, br.status
FROM boats b
LEFT JOIN boat_reservations br ON b.boat_id = br.boat_id
LEFT JOIN teams t ON br.team_id = t.team_id
WHERE br.reservation_date = '2025-01-15'
  AND br.status IN ('Reserved', 'In Use')
ORDER BY b.name, br.start_time;
```

### Get cross-team regatta participation:
```sql
SELECT t.name as team_name, r.name as regatta_name,
       COUNT(CASE WHEN rr.status = 'Committed' THEN 1 END) as committed_count,
       COUNT(CASE WHEN rr.coach_approved = true THEN 1 END) as approved_count
FROM teams t
JOIN regatta_registrations rr ON t.team_id = rr.team_id
JOIN regattas r ON rr.regatta_id = r.regatta_id
WHERE r.start_date >= CURRENT_DATE
GROUP BY t.team_id, t.name, r.regatta_id, r.name
ORDER BY t.name, r.start_date;
```

This multi-team design provides the flexibility to scale from a single team to a full boathouse while maintaining data isolation, shared resource management, and comprehensive analytics capabilities.
