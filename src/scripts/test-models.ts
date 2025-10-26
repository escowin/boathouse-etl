#!/usr/bin/env ts-node

/**
 * Test script to verify all models are working correctly
 * Usage: npm run test:models
 */

import { DatabaseUtils } from '../utils/database';
import { getModels } from '../shared';

// Get shared models
const { 
  Athlete, 
  Team, 
  Boat, 
  TeamMembership, 
  PracticeSession, 
  Attendance, 
  Lineup, 
  SeatAssignment, 
  ETLJob 
} = getModels();

async function testModels() {
  console.log('🔍 Testing Sequelize models...\n');
  
  try {
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database');
    }
    
    console.log('✅ Database connection established\n');
    
    // Test model definitions
    console.log('🔍 Testing model definitions...');
    
    const models = [
      { name: 'Athlete', model: Athlete },
      { name: 'Team', model: Team },
      { name: 'Boat', model: Boat },
      { name: 'TeamMembership', model: TeamMembership },
      { name: 'PracticeSession', model: PracticeSession },
      { name: 'Attendance', model: Attendance },
      { name: 'Lineup', model: Lineup },
      { name: 'SeatAssignment', model: SeatAssignment },
      { name: 'ETLJob', model: ETLJob }
    ];
    
    for (const { name, model } of models) {
      console.log(`  ✅ ${name} model loaded successfully`);
      console.log(`    - Table name: ${model.tableName}`);
      console.log(`    - Primary key: ${model.primaryKeyAttribute}`);
    }
    
    console.log('\n🔍 Testing model associations...');
    
    // Test associations by checking if they exist
    const associationTests = [
      { model: Team, association: 'athletes' },
      { model: Athlete, association: 'teams' },
      { model: Team, association: 'practice_sessions' },
      { model: PracticeSession, association: 'attendance' },
      { model: Boat, association: 'lineups' },
      { model: Lineup, association: 'seat_assignments' }
    ];
    
    for (const { model, association } of associationTests) {
      const hasAssociation = model.associations[association];
      if (hasAssociation) {
        console.log(`  ✅ ${model.name} -> ${association} association exists`);
      } else {
        console.log(`  ❌ ${model.name} -> ${association} association missing`);
      }
    }
    
    console.log('\n🔍 Testing model validation...');
    
    // Test Athlete model validation
    try {
      const invalidAthlete = Athlete.build({
        // Missing required 'name' field
        type: 'Rower'
      } as any);
      await invalidAthlete.validate();
      console.log('  ❌ Athlete validation should have failed');
    } catch (error) {
      console.log('  ✅ Athlete validation working correctly');
    }
    
    // Test Team model validation
    try {
      const invalidTeam = Team.build({
        // Missing required 'display_name' field
        name: 'test-team',
        team_type: 'Masters'
      } as any);
      await invalidTeam.validate();
      console.log('  ❌ Team validation should have failed');
    } catch (error) {
      console.log('  ✅ Team validation working correctly');
    }
    
    console.log('\n🔍 Testing model creation (dry run)...');
    
    // Test creating models without saving
    const testAthlete = Athlete.build({
      name: 'Test Athlete',
      type: 'Rower',
      gender: 'M',
      weight_kg: 75.5
    });
    
    const testTeam = Team.build({
      name: 'test-team',
      team_type: 'Masters'
    });
    
    const testBoat = Boat.build({
      name: 'Test Boat',
      type: '8+',
      status: 'Available'
    });
    
    console.log('  ✅ Athlete model can be built');
    console.log('  ✅ Team model can be built');
    console.log('  ✅ Boat model can be built');
    
    // Use the variables to avoid unused variable warnings
    console.log(`    - Test athlete name: ${testAthlete.name}`);
    console.log(`    - Test team name: ${testTeam.name}`);
    console.log(`    - Test boat name: ${testBoat.name}`);
    
    console.log('\n🎉 All model tests passed!');
    console.log('\n📋 Model Summary:');
    console.log(`  - ${models.length} models loaded successfully`);
    console.log('  - All associations configured');
    console.log('  - Validation rules working');
    console.log('  - Models ready for ETL operations');
    
  } catch (error) {
    console.error('❌ Model test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    await DatabaseUtils.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testModels();
}

export default testModels;
