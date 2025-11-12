-- 2.9.3 update
-- boat type update
SELECT * FROM boats
WHERE name = 'Erg'

CREATE TYPE boat_type_enum_new AS ENUM ('1x', '2x', '2-', '4x', '4+', '8+', 'Erg');

ALTER TABLE boats 
ALTER COLUMN type TYPE boat_type_enum_new 
USING type::text::boat_type_enum_new;

UPDATE boats
SET type = 'Erg'
WHERE name = 'Erg'

-- practice sessions: location > status
SELECT * FROM practice_sessions

UPDATE practice_sessions SET location = NULL;
ALTER TABLE practice_sessions RENAME COLUMN location TO status;
CREATE TYPE enum_practice_sessions_status AS ENUM ('scheduled', 'rescheduled', 'cancelled')

ALTER TABLE practice_sessions 
ALTER COLUMN status TYPE enum_practice_sessions_status 
USING 'scheduled'::enum_practice_sessions_status;

ALTER TABLE practice_sessions 
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'scheduled';

-- attendance: status enum > is_attending boolean
SELECT * FROM attendance
-- Step 1: Rename column
ALTER TABLE attendance RENAME COLUMN status TO is_attending;

-- Step 2: Convert ENUM to BOOLEAN
ALTER TABLE attendance 
ALTER COLUMN is_attending TYPE BOOLEAN 
USING CASE 
  WHEN is_attending::text = 'Yes' THEN true
  WHEN is_attending::text = 'No' THEN false
  ELSE false
END;

-- Step 3: Set NOT NULL and default
ALTER TABLE attendance 
ALTER COLUMN is_attending SET NOT NULL,
ALTER COLUMN is_attending SET DEFAULT false;

-- Step 4: Drop old ENUM type
DROP TYPE IF EXISTS enum_attendance_status;