#!/usr/bin/env ts-node

/**
 * Script to seed team_memberships table with data for all active athletes
 * Creates a membership record for each athlete where active = true
 * Usage: npm run seed:team-memberships
 */

// Load .env from boathouse-etl's own .env file
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

interface TeamMembershipData {
  athlete_id: string;
  team_id: number;
  role: 'Athlete' | 'Captain' | 'Coach' | 'Assistant Coach' | 'Secretary';
  joined_at: Date;
}

async function seedTeamMemberships() {
  const { DatabaseUtils } = require('../utils/database');
  const { getModels } = require('../shared');
  
  // Get shared models
  const { Athlete, TeamMembership } = getModels();
  
  console.log('🌱 Starting team memberships seeding...');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    
    if (!isInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }

    // Configuration
    const teamId = 1;
    const role = 'Athlete' as const;

    console.log(`📊 Fetching active athletes...`);

    // Get all active athletes
    const activeAthletes = await Athlete.findAll({
      where: {
        active: true
      },
      attributes: ['athlete_id', 'name']
    });

    console.log(`✅ Found ${activeAthletes.length} active athletes`);

    if (activeAthletes.length === 0) {
      console.log('⚠️  No active athletes found. Nothing to seed.');
      return;
    }

    // Check for existing team memberships to avoid duplicates
    const existingMemberships = await TeamMembership.findAll({
      where: {
        team_id: teamId
      },
      attributes: ['athlete_id']
    });

    const existingAthleteIds = new Set(existingMemberships.map((m: any) => m.dataValues.athlete_id));
    console.log(`🔍 Found ${existingMemberships.length} existing team memberships`);

    // Filter out athletes who already have memberships
    const newMemberships = activeAthletes.filter((athlete: any) => !existingAthleteIds.has(athlete.dataValues.athlete_id));
    
    console.log(`➕ Will create ${newMemberships.length} new team memberships`);

    if (newMemberships.length === 0) {
      console.log('✅ No new team memberships to create (all active athletes already have memberships)');
      return;
    }

    // Get current timestamp
    const now = new Date();

    // Create team membership data
    console.log('🔍 Debug: Sample athlete data:');
    if (newMemberships.length > 0) {
      console.log('First athlete:', JSON.stringify(newMemberships[0], null, 2));
      console.log('First athlete keys:', Object.keys(newMemberships[0]));
      console.log('First athlete athlete_id:', newMemberships[0].athlete_id);
      console.log('First athlete dataValues:', JSON.stringify(newMemberships[0].dataValues, null, 2));
    }
    
    const teamMemberships: TeamMembershipData[] = newMemberships.map((athlete: any) => ({
      athlete_id: athlete.dataValues.athlete_id,
      team_id: teamId,
      role: role,
      joined_at: now
    }));

    console.log('🔍 Debug: Sample team membership data:');
    if (teamMemberships.length > 0) {
      console.log('First membership:', JSON.stringify(teamMemberships[0], null, 2));
    }

    // Bulk insert team memberships
    console.log('💾 Inserting team memberships...');
    await TeamMembership.bulkCreate(teamMemberships, {
      validate: true,
      ignoreDuplicates: true
    });

    console.log(`✅ Successfully created ${teamMemberships.length} team memberships`);

    // Display summary
    console.log('📈 Summary:');
    console.log(`   Team ID: ${teamId}`);
    console.log(`   Role: ${role}`);
    console.log(`   Total memberships created: ${teamMemberships.length}`);
    
    // Show first few athlete names
    if (newMemberships.length > 0) {
      console.log('👥 Sample athletes added:');
      const sampleAthletes = newMemberships.slice(0, 5);
      sampleAthletes.forEach((athlete: any) => {
        console.log(`   - ${athlete.dataValues.name} (${athlete.dataValues.athlete_id})`);
      });
      if (newMemberships.length > 5) {
        console.log(`   ... and ${newMemberships.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    const { DatabaseUtils } = require('../utils/database');
    await DatabaseUtils.cleanup();
  }
}

// Run the seeding script
if (require.main === module) {
  seedTeamMemberships();
}

export default seedTeamMemberships;