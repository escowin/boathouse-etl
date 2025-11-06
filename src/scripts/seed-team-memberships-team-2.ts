#!/usr/bin/env ts-node

/**
 * Script to seed team_memberships table for team_id = 2
 * Creates membership records for female athletes who are active, not already on team 2,
 * and excludes specific athlete IDs
 * Usage: npm run seed:team-memberships-team-2
 */

// Load .env from boathouse-etl's own .env file
import dotenv from 'dotenv';
import path from 'path';

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { DatabaseUtils } from '../utils/database';
import { Op } from 'sequelize';
import { getModels } from '../shared';

interface TeamMembershipData {
  athlete_id: string;
  team_id: number;
  role: 'Athlete' | 'Captain' | 'Coach' | 'Assistant Coach' | 'Secretary';
  joined_at: Date;
}

async function seedTeamMemberships() {
  // Get shared models
  const { Athlete, TeamMembership } = getModels();
  
  console.log('🌱 Starting team memberships seeding for team 2...');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    
    if (!isInitialized) {
      console.error('❌ Database initialization failed');
      process.exit(1);
    }

    // Configuration
    const teamId = 2;
    const role = 'Athlete' as const;
    
    // Excluded athlete IDs
    const excludedAthleteIds = [
      '7fcac4f1-edfa-4cd0-bbc0-c64e9a619d4e',
      '2034046c-4982-4ad4-bf34-21e37dd82020'
    ];

    console.log(`📊 Fetching eligible athletes...`);
    console.log(`   Criteria: gender = 'F', active = true, not on team ${teamId}`);
    console.log(`   Excluded athlete IDs: ${excludedAthleteIds.join(', ')}`);

    // Get all female active athletes, excluding the specified IDs
    const eligibleAthletes = await Athlete.findAll({
      where: {
        gender: 'F',
        active: true,
        athlete_id: {
          [Op.notIn]: excludedAthleteIds
        }
      },
      attributes: ['athlete_id', 'name', 'gender', 'active']
    });

    console.log(`✅ Found ${eligibleAthletes.length} eligible athletes (female, active, not excluded)`);

    if (eligibleAthletes.length === 0) {
      console.log('⚠️  No eligible athletes found. Nothing to seed.');
      return;
    }

    // Check for existing team memberships on team 2 to avoid duplicates
    const existingMemberships = await TeamMembership.findAll({
      where: {
        team_id: teamId
      },
      attributes: ['athlete_id']
    });

    const existingAthleteIds = new Set(existingMemberships.map((m: any) => m.dataValues.athlete_id));
    console.log(`🔍 Found ${existingMemberships.length} existing team memberships for team ${teamId}`);

    // Filter out athletes who already have memberships on team 2
    const newMemberships = eligibleAthletes.filter((athlete: any) => {
      const athleteId = athlete.dataValues.athlete_id;
      return !existingAthleteIds.has(athleteId);
    });
    
    console.log(`➕ Will create ${newMemberships.length} new team memberships for team ${teamId}`);

    if (newMemberships.length === 0) {
      console.log(`✅ No new team memberships to create (all eligible athletes already have memberships on team ${teamId})`);
      return;
    }

    // Get current timestamp
    const now = new Date();

    // Create team membership data
    const teamMemberships: TeamMembershipData[] = newMemberships.map((athlete: any) => ({
      athlete_id: athlete.dataValues.athlete_id,
      team_id: teamId,
      role: role,
      joined_at: now
    }));

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
    console.log(`   Eligible athletes found: ${eligibleAthletes.length}`);
    console.log(`   Existing memberships on team ${teamId}: ${existingMemberships.length}`);
    
    // Show all athletes added (since there should be ~10)
    if (newMemberships.length > 0) {
      console.log('👥 Athletes added to team 2:');
      newMemberships.forEach((athlete: any) => {
        console.log(`   - ${athlete.dataValues.name} (${athlete.dataValues.athlete_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run the seeding script
if (require.main === module) {
  seedTeamMemberships();
}

export default seedTeamMemberships;

