# Migration Plan: Challenge Seeds ETL

## Overview

This migration script will:
1. Parse the CSV file containing 2x1000m erg test scores
2. Create saved lineups and seat assignments for each athlete
3. Create challenge lineups linking saved lineups to challenge #2 (1k Challenge)
4. Create challenge entries from CSV data with best times

## Athlete Mapping

Map CSV rower names to athlete IDs. Handle name variants (e.g., "J.P. Nicot" and "JP Nicot" both map to the same athlete).

| athlete_id | name | CSV Name Variants |
| --- | --- | --- |
| 6ddcad42-ca78-41c2-9751-42c30f2e855c | Billy Ward | "Billy Ward" |
| af2e1f9a-d8a8-416b-a065-551649778eb5 | Bob Morse | "Bob Morse" |
| 468fe214-7395-492f-bc69-d0012e5885c3 | Brendon Reimer | "Brendon Reimer" |
| 6eaf0a3c-3b54-46a6-b7cb-53cd37cf3977 | Brian Minzenmayer | "Brian Minzenmayer" |
| 5f1e9d25-b5e7-4dd6-bd87-6720bede2578 | Brittany Glasschroeder | "Brittany Glasschroeder" |
| d6272f7a-f879-42f7-b3c7-90b25b23fcac | Corrie Kutkey | "Corrie Kutkey" |
| 7f3ea65d-e497-441c-b9f6-e9bae12da8d3 | Craig Johnston | "Craig Johnston" |
| ca663399-b6ec-43c1-9f17-f406ea1dbbb4 | Craig Robinson | "Craig Robinson" |
| 6f1e8543-4128-4ec6-9dcf-ec8aa1fd10e2 | Cullen Archer | "Cullen Archer" |
| d5450ff3-6ae9-4d06-ad41-f0b621c9261b | Edwin Escobar | "Edwin Escobar" |
| f2dfecaa-3e25-4fa7-b8ee-1de9131d27eb | Erich Meiske | "Erich Meiske" |
| f9944177-d42f-4269-8a10-df4694ad4c84 | Erik Cornet | "Erik Cornet" |
| e0f26781-602b-4416-834f-5d052b42ceca | Fred Frey | "Fred Frey" |
| 71bac186-8ba0-453e-956d-d559c683553f | Gil Herbeck | "Gil Herbeck" |
| 4d358e3a-0957-4ee1-ac76-55f3518e574e | J.P. Nicot | "J.P. Nicot", "JP Nicot" |
| c24f379f-3b10-4a35-8438-262c250ca0f4 | Jasbir Singh | "Jasbir Singh" |
| fe764723-9618-49f3-b879-6945a355af02 | John Winstead | "John Winstead" |
| f798ca23-78ff-4857-a386-ee1f208058e7 | Ken Gates | "Ken Gates" |
| 4d9808f4-6eaa-43e0-b208-9c39e17056c3 | Kevin Kimber | "Kevin Kimber" |
| af981c4c-f33e-466a-bb7e-a9f42dd92116 | Lee Rehwinkel | "Lee Rehwinkel" |
| 9f351135-98b9-47b4-8e3e-9cf7f46273fd | Mike Anderson | "Mike Anderson" |
| 3c1da720-c713-45d6-b1a7-ce878ebf353e | Nick Ivanecky | "Nick Ivanecky" |
| b645cebe-ce5c-450f-865d-cf706ca72dec | Nik Vantfoort | "Nik Vantfoort" |
| 85842ffa-745c-4d78-910f-34ec4c11b2b2 | Phil Ellis | "Phil Ellis" |
| faa96c84-e693-44fc-bd12-63fb93161cf1 | Robin Cho | "Robin Cho" |
| a8e6c7c2-a32a-4e98-a78d-245b46625ac0 | Scott Bolton | "Scott Bolton" |
| 02699b8c-a873-4211-8c98-56f79717f12e | Steve Henry | "Steve Henry" |
| d445ee6b-a31a-45cb-b51b-19769f113792 | Susie Morse | "Susie Morse" |
| d9ca9429-7e82-4e5e-9697-b6887da306cf | Tristan Hite | "Tristan Hite" |

## Data Structures

### saved_lineups
```json
{
    "saved_lineup_id": "uuidv4",
    "boat_id": "49cd4838-597b-4577-8889-ebd4389dfed7",
    "lineup_name": "string (athlete.name)",
    "created_by": "uuid (athlete.athlete_id)",
    "is_active": true,
    "team_id": null
}
```

### saved_lineup_seat_assignments
```json
{
    "saved_lineup_seat_id": "uuidv4",
    "saved_lineup_id": "uuid (from saved_lineup above)",
    "athlete_id": "uuid (athlete.athlete_id)",
    "seat_number": 1,
    "side": null
}
```

### challenge_lineups
```json
{
    "challenge_lineup_id": "uuidv4",
    "challenge_id": 2,
    "saved_lineup_id": "uuid (from saved_lineup above)",
    "is_active": true
}
```

### challenge_entries
```json
{
    "challenge_entry_id": "uuidv4",
    "lineup_id": "uuid (challenge_lineup_id from above)",
    "time_seconds": "decimal (best of First 1k and Second 1k)",
    "stroke_rate": null,
    "split_seconds": null,
    "entry_date": "date (from CSV Date field)",
    "entry_time": "timestamp (from CSV Date + Time fields)",
    "notes": null,
    "conditions": null
}
```

## CSV File Structure

**File Path:** `data/2x1000m erg test scores  - Combined Results.csv`

**Fields:**
- `Date`: Date string (e.g., "4/28/2025") → maps to `entry_date` (DATEONLY)
- `Time`: Time string (e.g., "1:01:01 AM") → maps to `entry_time` (TIMESTAMP, combined with Date)
- `Rower`: Athlete name → maps to athlete via name mapping table
- `First 1k`: Time in seconds (decimal) → used for best time calculation
- `Second 1k`: Time in seconds (decimal) → used for best time calculation

## Migration Steps

### Step 1: Parse CSV File
1. Read CSV file from `data/2x1000m erg test scores  - Combined Results.csv`
2. Parse each row (skip header row)
3. For each row:
   - Map `Rower` name to `athlete_id` using mapping table (handle "J.P. Nicot" / "JP Nicot" variant)
   - Parse `Date` field to Date object
   - Parse `Time` field and combine with `Date` to create full timestamp
   - Parse `First 1k` and `Second 1k` as decimal numbers
   - Calculate best time: `Math.min(First 1k, Second 1k)` (handle empty/null values)

### Step 2: Create Saved Lineups (One Per Athlete)
For each unique athlete from the mapping table:
1. Generate `saved_lineup_id` (UUID v4)
2. Insert into `saved_lineups`:
   - `saved_lineup_id`: generated UUID
   - `boat_id`: `"49cd4838-597b-4577-8889-ebd4389dfed7"` (erg boat)
   - `lineup_name`: athlete name
   - `created_by`: athlete_id
   - `is_active`: `true`
   - `team_id`: `null`
   - `created_at`: current timestamp
   - `updated_at`: current timestamp

### Step 3: Create Saved Lineup Seat Assignments
For each saved_lineup created in Step 2:
1. Generate `saved_lineup_seat_id` (UUID v4)
2. Insert into `saved_lineup_seat_assignments`:
   - `saved_lineup_seat_id`: generated UUID
   - `saved_lineup_id`: from Step 2
   - `athlete_id`: athlete_id
   - `seat_number`: `1`
   - `side`: `null`
   - `created_at`: current timestamp
   - `updated_at`: current timestamp

### Step 4: Create Challenge Lineups
For each saved_lineup created in Step 2:
1. Generate `challenge_lineup_id` (UUID v4)
2. Insert into `challenge_lineups`:
   - `challenge_lineup_id`: generated UUID
   - `challenge_id`: `2` (1k Challenge)
   - `saved_lineup_id`: from Step 2
   - `is_active`: `true`
   - `created_at`: current timestamp
   - `updated_at`: current timestamp

### Step 5: Create Challenge Entries
For each row in the parsed CSV:
1. Find the athlete's `challenge_lineup_id` from Step 4
2. Generate `challenge_entry_id` (UUID v4)
3. Calculate best time:
   - If both `First 1k` and `Second 1k` are present: `Math.min(First 1k, Second 1k)`
   - If only one is present: use that value
   - If both are empty/null: skip this row (log warning)
4. Parse date/time:
   - `entry_date`: Parse `Date` field as DATEONLY (YYYY-MM-DD)
   - `entry_time`: Combine `Date` + `Time` fields into full TIMESTAMP
5. Insert into `challenge_entries`:
   - `challenge_entry_id`: generated UUID
   - `lineup_id`: `challenge_lineup_id` from Step 4
   - `time_seconds`: best time (decimal)
   - `stroke_rate`: `null`
   - `split_seconds`: `null`
   - `entry_date`: parsed date
   - `entry_time`: parsed timestamp
   - `notes`: `null`
   - `conditions`: `null`
   - `created_at`: current timestamp
   - `updated_at`: current timestamp

## Data Transformation Rules

### Name Mapping
- Create a mapping object: `{ "J.P. Nicot": athlete_id, "JP Nicot": athlete_id }` (both map to same athlete)
- For all other athletes, use exact name match
- Case-sensitive matching

### Date/Time Parsing
- `Date` format: "M/D/YYYY" (e.g., "4/28/2025")
- `Time` format: "h:mm:ss AM/PM" (e.g., "1:01:01 AM")
- Combine to create full timestamp: `new Date("4/28/2025 1:01:01 AM")`
- `entry_date`: Extract date portion only (YYYY-MM-DD)
- `entry_time`: Full timestamp

### Best Time Calculation
- Compare `First 1k` and `Second 1k` as decimal numbers
- Best = minimum value (fastest time)
- Handle empty strings, null, or undefined values:
  - If both present: use minimum
  - If one present: use that value
  - If neither present: skip entry (log warning)

### Error Handling
- If athlete name not found in mapping: log error and skip row
- If date/time parsing fails: log error and skip row
- If both 1k times are missing: log warning and skip entry
- Use database transaction to ensure all-or-nothing insertion

## Implementation Notes

- Use Sequelize migration format (similar to `20251110150000-create-challenge-leaderboard-tables.js`)
- Wrap all inserts in a transaction
- Use `csv-parser` or similar library to parse CSV
- Use `uuid` library to generate UUIDs
- Use `moment` or native `Date` for date/time parsing
- Add console logging for progress tracking
- Validate data before insertion (check foreign keys exist)