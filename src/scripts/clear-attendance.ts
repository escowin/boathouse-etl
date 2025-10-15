/**
 * Clear Attendance Table
 * Removes all attendance records to start fresh
 */

import sequelize from '../config/database';
import { Attendance } from '../models';

async function clearAttendanceTable() {
  try {
    console.log('🗑️  Clearing attendance table...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Clear all attendance records
    const deletedCount = await Attendance.destroy({
      where: {},
      force: true // Hard delete
    });
    
    console.log(`✅ Cleared ${deletedCount} attendance records`);
    console.log('🎉 Attendance table is now empty and ready for fresh ETL');
    
  } catch (error) {
    console.error('❌ Error clearing attendance table:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
clearAttendanceTable();
