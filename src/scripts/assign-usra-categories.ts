#!/usr/bin/env ts-node

/**
 * Script to assign USRA age category IDs to athletes based on their birth year
 * Calculates current age (current year - birth_year) and matches against
 * usra_categories table age ranges (start_age to end_age)
 * 
 * Usage: npm run assign-usra-categories
 */

import { DatabaseUtils } from '../utils/database';
import { Op } from 'sequelize';
import { getModels } from '../shared';

// Get shared models
const { Athlete, UsraCategory } = getModels();

async function assignUsraCategories() {
  try {
    console.log('🏃 Starting USRA category assignment...');
    console.log('==========================================\n');
    
    // Initialize database connection
    const isInitialized = await DatabaseUtils.initialize();
    if (!isInitialized) {
      throw new Error('Failed to initialize database connection');
    }

    // Get current year for age calculation
    const currentYear = new Date().getFullYear();
    console.log(`📅 Current year: ${currentYear}\n`);

    // Fetch all USRA categories (use raw: true to get plain objects)
    console.log('📊 Fetching USRA categories...');
    const categories = await UsraCategory.findAll({
      order: [['start_age', 'ASC']],
      raw: true
    }) as Array<{
      usra_category_id: number;
      start_age: number;
      end_age: number;
      category: string;
      created_at: Date;
      updated_at: Date;
    }>;
    console.log(`✅ Found ${categories.length} USRA categories\n`);

    // Display categories for reference
    console.log('📋 Available USRA Categories:');
    categories.forEach((cat) => {
      console.log(`   ID ${cat.usra_category_id}: ${cat.category} (ages ${cat.start_age}-${cat.end_age})`);
    });
    console.log('');

    // Fetch all athletes with birth_year
    console.log('👥 Fetching athletes with birth_year...');
    const athletes = await Athlete.findAll({
      where: {
        birth_year: {
          [Op.not]: null
        }
      },
      attributes: ['athlete_id', 'name', 'birth_year', 'usra_age_category_id']
    });
    console.log(`✅ Found ${athletes.length} athletes with birth_year\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const updates: Array<{ athlete: string; oldCategory: string | null; newCategory: string; age: number }> = [];
    const errors: Array<{ athlete: string; error: string }> = [];

    // Process each athlete
    console.log('🔄 Processing athletes...\n');
    for (const athlete of athletes) {
      try {
        // Use .get() to access Sequelize model properties
        const birthYear = athlete.get('birth_year') as number | null;
        const athleteName = athlete.get('name') as string;
        const currentCategoryId = athlete.get('usra_age_category_id') as number | null;

        if (!birthYear) {
          skippedCount++;
          continue;
        }

        // Calculate current age
        const age = currentYear - birthYear;

        // Find matching USRA category where age falls within start_age and end_age range
        const matchingCategory = categories.find((cat) => 
          age >= cat.start_age && age <= cat.end_age
        );

        if (!matchingCategory) {
          // No matching category found
          errors.push({
            athlete: `${athleteName} (born ${birthYear}, age ${age})`,
            error: `No matching USRA category found for age ${age}`
          });
          errorCount++;
          continue;
        }

        // Check if update is needed (compare with current category ID)
        if (currentCategoryId === matchingCategory.usra_category_id) {
          skippedCount++;
          continue;
        }

        // Get old category name for logging
        const oldCategory = currentCategoryId 
          ? categories.find((c) => c.usra_category_id === currentCategoryId)?.category || `ID ${currentCategoryId}`
          : 'None';

        // Update athlete with matching category ID
        await athlete.update({
          usra_age_category_id: matchingCategory.usra_category_id
        });

        updatedCount++;
        updates.push({
          athlete: athleteName,
          oldCategory,
          newCategory: matchingCategory.category,
          age
        });

        // Log progress every 10 updates
        if (updatedCount % 10 === 0) {
          console.log(`   Processed ${updatedCount + skippedCount + errorCount} athletes...`);
        }

      } catch (error: any) {
        errorCount++;
        errors.push({
          athlete: athlete.name,
          error: error.message || 'Unknown error'
        });
        console.error(`   ❌ Error processing ${athlete.name}:`, error.message);
      }
    }

    // Display summary
    console.log('\n📈 Summary:');
    console.log('==========================================');
    console.log(`   Total athletes processed: ${athletes.length}`);
    console.log(`   ✅ Updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (already correct): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    // Display updates
    if (updates.length > 0) {
      console.log('\n📝 Updates made:');
      console.log('==========================================');
      updates.slice(0, 20).forEach(update => {
        console.log(`   ${update.athlete} (age ${update.age}): ${update.oldCategory} → ${update.newCategory}`);
      });
      if (updates.length > 20) {
        console.log(`   ... and ${updates.length - 20} more updates`);
      }
    }

    // Display errors
    if (errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      console.log('==========================================');
      errors.forEach(error => {
        console.log(`   ${error.athlete}: ${error.error}`);
      });
    }

    console.log('\n✅ USRA category assignment completed successfully!');

  } catch (error) {
    console.error('❌ Error assigning USRA categories:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  assignUsraCategories()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { assignUsraCategories };

