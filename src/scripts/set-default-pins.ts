import dotenv from 'dotenv';
import { Op } from 'sequelize';
import { getAuth, getModels } from '../shared';

// Load environment variables
dotenv.config();

// Get shared resources
const { AuthService } = getAuth();
const { Athlete } = getModels();

async function setDefaultPins() {
  console.log('🔐 Setting default PINs for existing athletes...');
  
  try {
    const authService = new AuthService();
    
    // Get all active athletes without PINs
    const athletes = await Athlete.findAll({
      where: {
        active: true,
        competitive_status: 'active',
        pin_hash: {
          [Op.is]: null
        }
      } as any,
      attributes: ['athlete_id', 'name', 'email']
    });

    console.log(`📊 Found ${athletes.length} athletes without PINs`);

    if (athletes.length === 0) {
      console.log('✅ All athletes already have PINs set');
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const athlete of athletes) {
      try {
        // Use .get() method to access Sequelize model properties
        const athleteId = athlete.get('athlete_id') as string;
        const athleteName = athlete.get('name') as string;
        
        console.log(`Processing athlete: ${athleteName}, ID: ${athleteId}`);
        const result = await authService.setDefaultPin(athleteId);
        
        if (result.success) {
          console.log(`✅ Set default PIN for ${athleteName} (${athleteId})`);
          successCount++;
        } else {
          console.error(`❌ Failed to set PIN for ${athleteName}: ${result.message}`);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error setting PIN for athlete:`, error);
        errorCount++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Successfully set PINs: ${successCount}`);
    console.log(`❌ Failed to set PINs: ${errorCount}`);
    console.log(`📊 Total processed: ${athletes.length}`);

    if (successCount > 0) {
      console.log('\n🔔 Important:');
      console.log('• All athletes now have default PIN');
      console.log('• Athletes will be required to change PIN on first login');
      console.log('• PIN reset is enforced via pin_reset_required flag');
    }

  } catch (error) {
    console.error('❌ Error setting default PINs:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  setDefaultPins()
    .then(() => {
      console.log('🎉 Default PIN setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export default setDefaultPins;
