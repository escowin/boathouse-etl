const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

// Database connection
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'boathouse_etl',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  logging: false
});

async function resetEdwinPin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Hash a valid PIN (123456 is not in weak patterns)
    const validPin = '123456';
    const pinHash = await bcrypt.hash(validPin, 12);
    
    console.log('🔐 Generated PIN hash for PIN:', validPin);

    // Update Edwin Escobar's record
    const [updatedRows] = await sequelize.query(`
      UPDATE athletes 
      SET 
        pin_hash = :pinHash,
        pin_reset_required = false,
        failed_login_attempts = 0,
        locked_until = NULL,
        pin_created_at = NOW()
      WHERE name = 'Edwin Escobar'
    `, {
      replacements: { pinHash },
      type: Sequelize.QueryTypes.UPDATE
    });

    if (updatedRows > 0) {
      console.log('✅ Successfully updated Edwin Escobar\'s PIN');
      console.log('📝 Edwin can now login with PIN:', validPin);
    } else {
      console.log('❌ No rows updated - Edwin Escobar not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

resetEdwinPin();
