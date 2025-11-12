'use strict';

const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting challenge seeds migration...');
      
      // ===================================================================
      // Athlete Mapping
      // ===================================================================
      const athleteMapping = {
        'Billy Ward': '6ddcad42-ca78-41c2-9751-42c30f2e855c',
        'Bob Morse': 'af2e1f9a-d8a8-416b-a065-551649778eb5',
        'Brendon Reimer': '468fe214-7395-492f-bc69-d0012e5885c3',
        'Brian Minzenmayer': '6eaf0a3c-3b54-46a6-b7cb-53cd37cf3977',
        'Brittany Glasschroeder': '5f1e9d25-b5e7-4dd6-bd87-6720bede2578',
        'Corrie Kutkey': 'd6272f7a-f879-42f7-b3c7-90b25b23fcac',
        'Craig Johnston': '7f3ea65d-e497-441c-b9f6-e9bae12da8d3',
        'Craig Robinson': 'ca663399-b6ec-43c1-9f17-f406ea1dbbb4',
        'Cullen Archer': '6f1e8543-4128-4ec6-9dcf-ec8aa1fd10e2',
        'Edwin Escobar': 'd5450ff3-6ae9-4d06-ad41-f0b621c9261b',
        'Erich Meiske': 'f2dfecaa-3e25-4fa7-b8ee-1de9131d27eb',
        'Erik Cornet': 'f9944177-d42f-4269-8a10-df4694ad4c84',
        'Fred Frey': 'e0f26781-602b-4416-834f-5d052b42ceca',
        'Gil Herbeck': '71bac186-8ba0-453e-956d-d559c683553f',
        'J.P. Nicot': '4d358e3a-0957-4ee1-ac76-55f3518e574e',
        'JP Nicot': '4d358e3a-0957-4ee1-ac76-55f3518e574e', // Variant
        'Jasbir Singh': 'c24f379f-3b10-4a35-8438-262c250ca0f4',
        'John Winstead': 'fe764723-9618-49f3-b879-6945a355af02',
        'Ken Gates': 'f798ca23-78ff-4857-a386-ee1f208058e7',
        'Kevin Kimber': '4d9808f4-6eaa-43e0-b208-9c39e17056c3',
        'Lee Rehwinkel': 'af981c4c-f33e-466a-bb7e-a9f42dd92116',
        'Mike Anderson': '9f351135-98b9-47b4-8e3e-9cf7f46273fd',
        'Nick Ivanecky': '3c1da720-c713-45d6-b1a7-ce878ebf353e',
        'Nik Vantfoort': 'b645cebe-ce5c-450f-865d-cf706ca72dec',
        'Phil Ellis': '85842ffa-745c-4d78-910f-34ec4c11b2b2',
        'Robin Cho': 'faa96c84-e693-44fc-bd12-63fb93161cf1',
        'Scott Bolton': 'a8e6c7c2-a32a-4e98-a78d-245b46625ac0',
        'Steve Henry': '02699b8c-a873-4211-8c98-56f79717f12e',
        'Susie Morse': 'd445ee6b-a31a-45cb-b51b-19769f113792',
        'Tristan Hite': 'd9ca9429-7e82-4e5e-9697-b6887da306cf'
      };
      
      const athleteNames = {
        '6ddcad42-ca78-41c2-9751-42c30f2e855c': 'Billy Ward',
        'af2e1f9a-d8a8-416b-a065-551649778eb5': 'Bob Morse',
        '468fe214-7395-492f-bc69-d0012e5885c3': 'Brendon Reimer',
        '6eaf0a3c-3b54-46a6-b7cb-53cd37cf3977': 'Brian Minzenmayer',
        '5f1e9d25-b5e7-4dd6-bd87-6720bede2578': 'Brittany Glasschroeder',
        'd6272f7a-f879-42f7-b3c7-90b25b23fcac': 'Corrie Kutkey',
        '7f3ea65d-e497-441c-b9f6-e9bae12da8d3': 'Craig Johnston',
        'ca663399-b6ec-43c1-9f17-f406ea1dbbb4': 'Craig Robinson',
        '6f1e8543-4128-4ec6-9dcf-ec8aa1fd10e2': 'Cullen Archer',
        'd5450ff3-6ae9-4d06-ad41-f0b621c9261b': 'Edwin Escobar',
        'f2dfecaa-3e25-4fa7-b8ee-1de9131d27eb': 'Erich Meiske',
        'f9944177-d42f-4269-8a10-df4694ad4c84': 'Erik Cornet',
        'e0f26781-602b-4416-834f-5d052b42ceca': 'Fred Frey',
        '71bac186-8ba0-453e-956d-d559c683553f': 'Gil Herbeck',
        '4d358e3a-0957-4ee1-ac76-55f3518e574e': 'J.P. Nicot',
        'c24f379f-3b10-4a35-8438-262c250ca0f4': 'Jasbir Singh',
        'fe764723-9618-49f3-b879-6945a355af02': 'John Winstead',
        'f798ca23-78ff-4857-a386-ee1f208058e7': 'Ken Gates',
        '4d9808f4-6eaa-43e0-b208-9c39e17056c3': 'Kevin Kimber',
        'af981c4c-f33e-466a-bb7e-a9f42dd92116': 'Lee Rehwinkel',
        '9f351135-98b9-47b4-8e3e-9cf7f46273fd': 'Mike Anderson',
        '3c1da720-c713-45d6-b1a7-ce878ebf353e': 'Nick Ivanecky',
        'b645cebe-ce5c-450f-865d-cf706ca72dec': 'Nik Vantfoort',
        '85842ffa-745c-4d78-910f-34ec4c11b2b2': 'Phil Ellis',
        'faa96c84-e693-44fc-bd12-63fb93161cf1': 'Robin Cho',
        'a8e6c7c2-a32a-4e98-a78d-245b46625ac0': 'Scott Bolton',
        '02699b8c-a873-4211-8c98-56f79717f12e': 'Steve Henry',
        'd445ee6b-a31a-45cb-b51b-19769f113792': 'Susie Morse',
        'd9ca9429-7e82-4e5e-9697-b6887da306cf': 'Tristan Hite'
      };
      
      const BOAT_ID_ERG = '49cd4838-597b-4577-8889-ebd4389dfed7';
      const CHALLENGE_ID = 2; // 1k Challenge
      const now = new Date();
      
      // ===================================================================
      // Step 1: Parse CSV File
      // ===================================================================
      console.log('📖 Parsing CSV file...');
      // Resolve path relative to project root (two levels up from migrations directory)
      const projectRoot = path.resolve(__dirname, '../..');
      const csvPath = path.join(projectRoot, 'data', '2x1000m erg test scores  - Combined Results.csv');
      
      if (!fs.existsSync(csvPath)) {
        throw new Error(`CSV file not found at: ${csvPath}`);
      }
      
      const csvContent = fs.readFileSync(csvPath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Find column indices
      const dateIdx = headers.indexOf('Date');
      const timeIdx = headers.indexOf('Time');
      const rowerIdx = headers.indexOf('Rower');
      const first1kIdx = headers.indexOf('First 1k');
      const second1kIdx = headers.indexOf('Second 1k');
      
      if (dateIdx === -1 || timeIdx === -1 || rowerIdx === -1 || first1kIdx === -1 || second1kIdx === -1) {
        throw new Error('Required CSV columns not found');
      }
      
      // Parse CSV rows
      const csvRows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;
        
        // Simple CSV parsing (handles quoted fields)
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim()); // Add last value
        
        if (values.length > rowerIdx) {
          const rower = values[rowerIdx].trim();
          const athleteId = athleteMapping[rower];
          
          if (!athleteId) {
            console.warn(`⚠️  Skipping row ${i + 1}: Athlete "${rower}" not found in mapping`);
            continue;
          }
          
          csvRows.push({
            date: values[dateIdx]?.trim(),
            time: values[timeIdx]?.trim(),
            rower: rower,
            athleteId: athleteId,
            first1k: values[first1kIdx]?.trim() || null,
            second1k: values[second1kIdx]?.trim() || null
          });
        }
      }
      
      console.log(`✅ Parsed ${csvRows.length} CSV rows`);
      
      // ===================================================================
      // Helper Functions
      // ===================================================================
      function parseDate(dateStr) {
        // Format: "M/D/YYYY" (e.g., "4/28/2025")
        const parts = dateStr.split('/');
        if (parts.length !== 3) {
          throw new Error(`Invalid date format: ${dateStr}`);
        }
        const month = parseInt(parts[0], 10);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        return new Date(year, month - 1, day);
      }
      
      function parseTime(timeStr) {
        // Format: "h:mm:ss AM/PM" (e.g., "1:01:01 AM")
        // This is a simplified parser - may need adjustment for edge cases
        const match = timeStr.match(/(\d+):(\d+):(\d+)\s+(AM|PM)/i);
        if (!match) {
          throw new Error(`Invalid time format: ${timeStr}`);
        }
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        const ampm = match[4].toUpperCase();
        
        if (ampm === 'PM' && hours !== 12) {
          hours += 12;
        } else if (ampm === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return { hours, minutes, seconds };
      }
      
      function combineDateAndTime(dateStr, timeStr) {
        const date = parseDate(dateStr);
        const time = parseTime(timeStr);
        date.setHours(time.hours, time.minutes, time.seconds, 0);
        return date;
      }
      
      function calculateBestTime(first1k, second1k) {
        const first = first1k ? parseFloat(first1k) : null;
        const second = second1k ? parseFloat(second1k) : null;
        
        if (first !== null && second !== null) {
          return Math.min(first, second);
        } else if (first !== null) {
          return first;
        } else if (second !== null) {
          return second;
        }
        return null;
      }
      
      // ===================================================================
      // Step 2: Create Saved Lineups (One Per Athlete)
      // ===================================================================
      console.log('📝 Creating saved lineups...');
      const savedLineups = [];
      const athleteToSavedLineup = {};
      
      for (const athleteId of Object.keys(athleteNames)) {
        const savedLineupId = randomUUID();
        const athleteName = athleteNames[athleteId];
        
        savedLineups.push({
          saved_lineup_id: savedLineupId,
          boat_id: BOAT_ID_ERG,
          lineup_name: athleteName,
          created_by: athleteId,
          is_active: true,
          team_id: null,
          created_at: now,
          updated_at: now
        });
        
        athleteToSavedLineup[athleteId] = savedLineupId;
      }
      
      await queryInterface.bulkInsert('saved_lineups', savedLineups, { transaction });
      console.log(`✅ Created ${savedLineups.length} saved lineups`);
      
      // ===================================================================
      // Step 3: Create Saved Lineup Seat Assignments
      // ===================================================================
      console.log('📝 Creating saved lineup seat assignments...');
      const seatAssignments = [];
      
      for (const athleteId of Object.keys(athleteNames)) {
        const savedLineupId = athleteToSavedLineup[athleteId];
        
        seatAssignments.push({
          saved_lineup_seat_id: randomUUID(),
          saved_lineup_id: savedLineupId,
          athlete_id: athleteId,
          seat_number: 1,
          side: null,
          created_at: now,
          updated_at: now
        });
      }
      
      await queryInterface.bulkInsert('saved_lineup_seat_assignments', seatAssignments, { transaction });
      console.log(`✅ Created ${seatAssignments.length} seat assignments`);
      
      // ===================================================================
      // Step 4: Create Challenge Lineups
      // ===================================================================
      console.log('📝 Creating challenge lineups...');
      const challengeLineups = [];
      const savedLineupToChallengeLineup = {};
      
      for (const athleteId of Object.keys(athleteNames)) {
        const savedLineupId = athleteToSavedLineup[athleteId];
        const challengeLineupId = randomUUID();
        
        challengeLineups.push({
          challenge_lineup_id: challengeLineupId,
          challenge_id: CHALLENGE_ID,
          saved_lineup_id: savedLineupId,
          is_active: true,
          created_at: now,
          updated_at: now
        });
        
        savedLineupToChallengeLineup[savedLineupId] = challengeLineupId;
      }
      
      await queryInterface.bulkInsert('challenge_lineups', challengeLineups, { transaction });
      console.log(`✅ Created ${challengeLineups.length} challenge lineups`);
      
      // ===================================================================
      // Step 5: Create Challenge Entries
      // ===================================================================
      console.log('📝 Creating challenge entries...');
      const challengeEntries = [];
      let skippedRows = 0;
      
      for (const row of csvRows) {
        const savedLineupId = athleteToSavedLineup[row.athleteId];
        if (!savedLineupId) {
          console.warn(`⚠️  Skipping entry: No saved lineup found for athlete ${row.athleteId}`);
          skippedRows++;
          continue;
        }
        
        const challengeLineupId = savedLineupToChallengeLineup[savedLineupId];
        if (!challengeLineupId) {
          console.warn(`⚠️  Skipping entry: No challenge lineup found for saved lineup ${savedLineupId}`);
          skippedRows++;
          continue;
        }
        
        // Calculate best time
        const bestTime = calculateBestTime(row.first1k, row.second1k);
        if (bestTime === null) {
          console.warn(`⚠️  Skipping entry: No valid time for ${row.rower} on ${row.date}`);
          skippedRows++;
          continue;
        }
        
        // Parse date and time
        let entryDate, entryTime;
        try {
          entryTime = combineDateAndTime(row.date, row.time);
          entryDate = new Date(entryTime);
          entryDate.setHours(0, 0, 0, 0); // Reset to midnight for DATEONLY
        } catch (error) {
          console.warn(`⚠️  Skipping entry: Date/time parsing error for ${row.rower} - ${error.message}`);
          skippedRows++;
          continue;
        }
        
        challengeEntries.push({
          challenge_entry_id: randomUUID(),
          lineup_id: challengeLineupId,
          time_seconds: bestTime,
          stroke_rate: null,
          split_seconds: null,
          entry_date: entryDate,
          entry_time: entryTime,
          notes: null,
          conditions: null,
          created_at: now,
          updated_at: now
        });
      }
      
      if (challengeEntries.length > 0) {
        await queryInterface.bulkInsert('challenge_entries', challengeEntries, { transaction });
        console.log(`✅ Created ${challengeEntries.length} challenge entries`);
      }
      
      if (skippedRows > 0) {
        console.warn(`⚠️  Skipped ${skippedRows} entries due to missing or invalid data`);
      }
      
      await transaction.commit();
      console.log('✅ Successfully completed challenge seeds migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error in challenge seeds migration:', error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back challenge seeds migration...');
      
      // Delete in reverse order of creation (respecting foreign key dependencies)
      await queryInterface.bulkDelete('challenge_entries', {}, { transaction });
      await queryInterface.bulkDelete('challenge_lineups', {}, { transaction });
      await queryInterface.bulkDelete('saved_lineup_seat_assignments', {}, { transaction });
      await queryInterface.bulkDelete('saved_lineups', {}, { transaction });
      
      await transaction.commit();
      console.log('✅ Successfully rolled back challenge seeds migration');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error rolling back migration:', error);
      throw error;
    }
  }
};

