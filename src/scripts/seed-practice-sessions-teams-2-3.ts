#!/usr/bin/env ts-node

/**
 * Script to seed practice sessions for teams 2 and 3 from now until end of year
 * Team 2: Tuesday, Thursday, Friday, Saturday (5:45 AM - 7:15 AM)
 * Team 3: Sunday (6:15 AM - 8:00 AM)
 * Usage: npm run seed:practice-sessions-teams-2-3
 */

import { DatabaseUtils } from '../utils/database';
import { Op } from 'sequelize';
import { getModels } from '../shared';

// Get shared models
const { PracticeSession } = getModels();

interface PracticeSessionData {
  team_id: number;
  date: Date;
  start_time: string;
  end_time: string;
  session_type: 'Practice';
  location: string;
}

interface TeamConfig {
  team_id: number;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  start_time: string;
  end_time: string;
  location: string;
}

async function seedPracticeSessions() {
  console.log('🌱 Starting practice sessions seeding for teams 2 and 3...');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    
    if (!isInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }

    // Team configurations
    const teamConfigs: TeamConfig[] = [
      {
        team_id: 2,
        daysOfWeek: [2, 4, 5, 6], // Tuesday, Thursday, Friday, Saturday
        start_time: '05:45:00',
        end_time: '07:15:00',
        location: 'Ladybird Lake'
      },
      {
        team_id: 3,
        daysOfWeek: [0], // Sunday
        start_time: '06:15:00',
        end_time: '08:00:00',
        location: 'Ladybird Lake'
      }
    ];

    // Get current date and end of year
    const now = new Date();
    const endOfYear = new Date('2025-12-31');
    
    console.log(`📅 Seeding from ${now.toDateString()} to ${endOfYear.toDateString()}`);

    let totalCreated = 0;

    // Process each team
    for (const config of teamConfigs) {
      console.log(`\n🏋️ Processing Team ${config.team_id}...`);
      
      // Generate practice session dates for this team
      const practiceDates = generatePracticeDates(now, endOfYear, config.daysOfWeek);
      console.log(`📊 Generated ${practiceDates.length} practice session dates for Team ${config.team_id}`);

      // Check for existing sessions to avoid duplicates
      const existingSessions = await PracticeSession.findAll({
        where: {
          team_id: config.team_id,
          date: {
            [Op.gte]: now,
            [Op.lte]: endOfYear
          }
        }
      });

      const existingDates = new Set(existingSessions.map((session: any) => session.date.toISOString().split('T')[0]));
      console.log(`🔍 Found ${existingSessions.length} existing sessions for Team ${config.team_id}`);

      // Filter out existing dates
      const newDates = practiceDates.filter(date => {
        const dateString = date.toISOString().split('T')[0];
        return !existingDates.has(dateString);
      });

      console.log(`➕ Will create ${newDates.length} new practice sessions for Team ${config.team_id}`);

      if (newDates.length === 0) {
        console.log(`✅ No new practice sessions to create for Team ${config.team_id}`);
        continue;
      }

      // Create practice session data
      const practiceSessions: PracticeSessionData[] = newDates.map(date => ({
        team_id: config.team_id,
        date: date,
        start_time: config.start_time,
        end_time: config.end_time,
        session_type: 'Practice' as const,
        location: config.location
      }));

      // Bulk insert practice sessions
      console.log(`💾 Inserting practice sessions for Team ${config.team_id}...`);
      await PracticeSession.bulkCreate(practiceSessions, {
        validate: true,
        ignoreDuplicates: true
      });

      totalCreated += newDates.length;
      console.log(`✅ Successfully created ${newDates.length} practice sessions for Team ${config.team_id}`);
      
      // Display summary by day of week
      const summary = practiceSessions.reduce((acc, session) => {
        const dayOfWeek = session.date.toLocaleDateString('en-US', { weekday: 'long' });
        acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log(`📈 Summary by day for Team ${config.team_id}:`);
      Object.entries(summary).forEach(([day, count]) => {
        console.log(`   ${day}: ${count} sessions`);
      });

      // Show first few and last few dates
      console.log(`📅 Sample dates for Team ${config.team_id}:`);
      const sampleDates = [
        ...newDates.slice(0, 3),
        ...(newDates.length > 6 ? ['...'] : []),
        ...newDates.slice(-3)
      ].filter(date => date !== '...');
      
      sampleDates.forEach(date => {
        if (date instanceof Date) {
          const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
          console.log(`   ${date.toDateString()} (${dayOfWeek})`);
        } else {
          console.log(`   ${date}`);
        }
      });
    }

    console.log(`\n🎉 Total: Successfully created ${totalCreated} practice sessions across all teams`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

/**
 * Generate practice session dates for specified days of week
 * from startDate to endDate (inclusive)
 * @param startDate - Start date for generating sessions
 * @param endDate - End date for generating sessions
 * @param targetDays - Array of day numbers (0 = Sunday, 1 = Monday, etc.)
 */
function generatePracticeDates(startDate: Date, endDate: Date, targetDays: number[]): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Set to start of day to avoid timezone issues
  currentDate.setHours(0, 0, 0, 0);
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    if (targetDays.includes(dayOfWeek)) {
      dates.push(new Date(currentDate));
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

// Run the seeding script
if (require.main === module) {
  seedPracticeSessions();
}

export default seedPracticeSessions;

