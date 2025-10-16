import dotenv from 'dotenv';
import { Op } from 'sequelize';
import Athlete from '../models/Athlete';

// Load environment variables
dotenv.config();

async function debugAthletes() {
  console.log('🔍 Debugging athlete data...');
  
  try {
    // Test basic connection
    console.log('1. Testing database connection...');
    await Athlete.sequelize?.authenticate();
    console.log('✅ Database connection successful');

    // Test simple query
    console.log('2. Testing simple athlete query...');
    const count = await Athlete.count();
    console.log(`✅ Total athletes in database: ${count}`);

    // Test the exact query from the script
    console.log('3. Testing the exact query from set-default-pins script...');
    const athletes = await Athlete.findAll({
      where: {
        active: true,
        competitive_status: 'active',
        pin_hash: {
          [Op.is]: null
        }
      } as any,
      attributes: ['athlete_id', 'name', 'email'],
      limit: 3 // Just get first 3 for debugging
    });

    console.log(`✅ Found ${athletes.length} athletes without PINs`);
    
    // Debug the actual data
    athletes.forEach((athlete, index) => {
      console.log(`Athlete ${index + 1}:`);
      console.log(`  - Raw data:`, athlete.toJSON());
      console.log(`  - athlete_id:`, athlete.athlete_id);
      console.log(`  - name:`, athlete.name);
      console.log(`  - email:`, athlete.email);
      console.log(`  - Data types:`, {
        athlete_id: typeof athlete.athlete_id,
        name: typeof athlete.name,
        email: typeof athlete.email
      });
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

// Run the debug script
if (require.main === module) {
  debugAthletes()
    .then(() => {
      console.log('🎉 Debug completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Debug failed:', error);
      process.exit(1);
    });
}

export default debugAthletes;
