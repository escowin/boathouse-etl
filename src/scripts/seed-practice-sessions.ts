#!/usr/bin/env ts-node

/**
 * Script to seed practice sessions from now until end of 2025
 * Creates practice sessions for Monday, Wednesday, Friday, and Saturday
 * Usage: npm run seed:practice-sessions
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

async function seedPracticeSessions() {
  console.log('🌱 Starting practice sessions seeding...');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    
    if (!isInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }

    // Configuration
    const teamId = 1;
    const startTime = '06:15:00';
    const endTime = '08:00:00';
    const sessionType = 'Practice' as const;
    const location = 'Ladybird Lake';

    // Get current date and end of year
    const now = new Date();
    const endOfYear = new Date('2025-12-31');
    
    console.log(`📅 Seeding from ${now.toDateString()} to ${endOfYear.toDateString()}`);

    // Generate practice session dates
    const practiceDates = generatePracticeDates(now, endOfYear);
    console.log(`📊 Generated ${practiceDates.length} practice session dates`);

    // Check for existing sessions to avoid duplicates
    const existingSessions = await PracticeSession.findAll({
      where: {
        team_id: teamId,
        date: {
          [Op.gte]: now,
          [Op.lte]: endOfYear
        }
      }
    });

    const existingDates = new Set(existingSessions.map((session: any) => session.date.toISOString().split('T')[0]));
    console.log(`🔍 Found ${existingSessions.length} existing sessions`);

    // Filter out existing dates
    const newDates = practiceDates.filter(date => {
      const dateString = date.toISOString().split('T')[0];
      return !existingDates.has(dateString);
    });

    console.log(`➕ Will create ${newDates.length} new practice sessions`);

    if (newDates.length === 0) {
      console.log('✅ No new practice sessions to create');
      return;
    }

    // Create practice session data
    const practiceSessions: PracticeSessionData[] = newDates.map(date => ({
      team_id: teamId,
      date: date,
      start_time: startTime,
      end_time: endTime,
      session_type: sessionType,
      location: location
    }));

    // Bulk insert practice sessions
    console.log('💾 Inserting practice sessions...');
    await PracticeSession.bulkCreate(practiceSessions, {
      validate: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Successfully created ${newDates.length} practice sessions`);
    
    // Display summary
    const summary = practiceSessions.reduce((acc, session) => {
      const dayOfWeek = session.date.toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('📈 Summary by day:');
    Object.entries(summary).forEach(([day, count]) => {
      console.log(`   ${day}: ${count} sessions`);
    });

    // Show first few and last few dates
    console.log('📅 Sample dates:');
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

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

/**
 * Generate practice session dates for Monday, Wednesday, Friday, and Saturday
 * from startDate to endDate (inclusive)
 */
function generatePracticeDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  
  // Set to start of day to avoid timezone issues
  currentDate.setHours(0, 0, 0, 0);
  
  // Target days: Monday (1), Wednesday (3), Friday (5), Saturday (6)
  const targetDays = [1, 3, 5, 6];
  
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
