/**
 * Reset Attendance Sequence
 * Resets the attendance_id sequence to start from 1
 */

import sequelize from '../config/database';

async function resetAttendanceSequence() {
  try {
    console.log('🔄 Resetting attendance_id sequence to start from 1...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Reset the sequence to start from 1
    await sequelize.query('ALTER SEQUENCE attendance_attendance_id_seq RESTART WITH 1;');
    
    console.log('✅ Attendance sequence reset to start from 1');
    console.log('🎉 Next attendance record will have ID = 1');
    
  } catch (error) {
    console.error('❌ Error resetting attendance sequence:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the script
resetAttendanceSequence();
