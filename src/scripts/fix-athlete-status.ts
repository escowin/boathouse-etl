#!/usr/bin/env ts-node

/**
 * Script to fix athlete status after UUID migration
 * Ensures all athletes have proper active and competitive_status values
 * Usage: npm run fix:athlete-status
 */

import { DatabaseUtils } from '../utils/database';
import { getModels } from '../shared';

// Get shared models
const { Athlete } = getModels();

async function fixAthleteStatus() {
  try {
    console.log('🔧 Starting athlete status fix...');
    
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Get all athletes
    const athletes = await Athlete.findAll({
      attributes: ['athlete_id', 'name', 'active', 'competitive_status']
    });

    console.log(`📊 Found ${athletes.length} athletes to check`);

    let fixedCount = 0;
    const issues: string[] = [];

    for (const athlete of athletes) {
      const updates: any = {};
      let needsUpdate = false;

      // Check if active is null or undefined
      if (athlete.active === null || athlete.active === undefined) {
        updates.active = true;
        needsUpdate = true;
        issues.push(`${athlete.name} (${athlete.athlete_id}): active was ${athlete.active}, setting to true`);
      }

      // Check if competitive_status is null, undefined, or not a valid value
      if (!athlete.competitive_status || !['active', 'inactive', 'retired', 'banned'].includes(athlete.competitive_status)) {
        updates.competitive_status = 'active';
        needsUpdate = true;
        issues.push(`${athlete.name} (${athlete.athlete_id}): competitive_status was ${athlete.competitive_status}, setting to active`);
      }

      if (needsUpdate) {
        await athlete.update(updates);
        fixedCount++;
        console.log(`✅ Fixed ${athlete.name} (${athlete.athlete_id})`);
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Total athletes checked: ${athletes.length}`);
    console.log(`   Athletes fixed: ${fixedCount}`);
    console.log(`   Issues found: ${issues.length}`);

    if (issues.length > 0) {
      console.log(`\n🔍 Issues fixed:`);
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n✅ Athlete status fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing athlete status:', error);
    process.exit(1);
  } finally {
    // Close database connection
    // Database connection will be closed automatically
  }
}

// Run the script
if (require.main === module) {
  fixAthleteStatus();
}

export { fixAthleteStatus };
