const { Sequelize } = require('sequelize');

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

async function clearPinResetFlag() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Clear pin_reset_required flag for Edwin Escobar
    const [updatedRows] = await sequelize.query(`
      UPDATE athletes 
      SET pin_reset_required = false
      WHERE name = 'Edwin Escobar'
    `, {
      type: Sequelize.QueryTypes.UPDATE
    });

    if (updatedRows > 0) {
      console.log('✅ Successfully cleared PIN reset flag for Edwin Escobar');
      console.log('🔐 Edwin can now login with his seeded PIN');
    } else {
      console.log('❌ No rows updated - Edwin Escobar not found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

clearPinResetFlag();
