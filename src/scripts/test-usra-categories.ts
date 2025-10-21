/**
 * Test script for USRA category resolution
 * This script tests the new athlete service with USRA category joins
 */

import { athleteService } from '../services';
import { Athlete, UsraCategory } from '../models';

async function testUsraCategoryResolution() {
  console.log('🧪 Testing USRA Category Resolution');
  console.log('=====================================');

  try {
    // Test 1: Get athletes for IndexedDB (limited data)
    console.log('\n📊 Test 1: Getting athletes for IndexedDB...');
    const indexedDbAthletes = await athleteService.getAthletesForIndexedDB();
    console.log(`✅ Found ${indexedDbAthletes.length} athletes for IndexedDB`);
    
    // Show sample data
    if (indexedDbAthletes.length > 0) {
      const sample = indexedDbAthletes[0];
      console.log('📋 Sample athlete data:');
      console.log(`   Name: ${sample.name}`);
      console.log(`   Age: ${sample.age || 'N/A'}`);
      console.log(`   USRA Category: ${sample.usra_category || 'N/A'}`);
      console.log(`   USRA Category ID: ${sample.usra_age_category_id || 'N/A'}`);
    }

    // Test 2: Get all athletes with USRA categories
    console.log('\n📊 Test 2: Getting all athletes with USRA categories...');
    const allAthletes = await athleteService.getAthletesWithUsraCategories();
    console.log(`✅ Found ${allAthletes.length} total athletes`);
    
    // Analyze USRA category distribution
    const categoryStats = allAthletes.reduce((stats, athlete) => {
      const category = athlete.usra_category || 'No Category';
      stats[category] = (stats[category] || 0) + 1;
      return stats;
    }, {} as Record<string, number>);
    
    console.log('📈 USRA Category Distribution:');
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} athletes`);
    });

    // Test 3: Test with filters
    console.log('\n📊 Test 3: Testing with filters...');
    const activeAthletes = await athleteService.getAthletesWithUsraCategories({
      active: true,
      competitive_status: 'active'
    });
    console.log(`✅ Found ${activeAthletes.length} active competitive athletes`);

    // Test 4: Get single athlete (if any exist)
    if (allAthletes.length > 0) {
      console.log('\n📊 Test 4: Getting single athlete profile...');
      const firstAthlete = allAthletes[0];
      const singleAthlete = await athleteService.getAthleteWithUsraCategory(firstAthlete.athlete_id);
      
      if (singleAthlete) {
        console.log('✅ Single athlete retrieved successfully');
        console.log(`   Name: ${singleAthlete.name}`);
        console.log(`   Age: ${singleAthlete.age || 'N/A'}`);
        console.log(`   USRA Category: ${singleAthlete.usra_category || 'N/A'}`);
        console.log(`   Email: ${singleAthlete.email || 'N/A'}`);
      } else {
        console.log('❌ Failed to retrieve single athlete');
      }
    }

    // Test 5: Verify database relationships
    console.log('\n📊 Test 5: Verifying database relationships...');
    const athletesWithRelations = await Athlete.findAll({
      include: [{
        model: UsraCategory,
        as: 'usra_age_category',
        required: false
      }],
      limit: 5,
      raw: false
    });

    console.log(`✅ Found ${athletesWithRelations.length} athletes with relationships`);
    athletesWithRelations.forEach((athlete, index) => {
      const athleteData = athlete.toJSON() as any;
      console.log(`   ${index + 1}. ${athleteData.name}: ${athleteData.usra_age_category?.category || 'No category'}`);
    });

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Total athletes: ${allAthletes.length}`);
    console.log(`   - IndexedDB athletes: ${indexedDbAthletes.length}`);
    console.log(`   - Active competitive athletes: ${activeAthletes.length}`);
    console.log(`   - Athletes with USRA categories: ${allAthletes.filter(a => a.usra_category).length}`);
    console.log(`   - Athletes without USRA categories: ${allAthletes.filter(a => !a.usra_category).length}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testUsraCategoryResolution()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export default testUsraCategoryResolution;
