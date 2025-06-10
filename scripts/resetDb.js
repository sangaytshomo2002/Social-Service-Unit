const User = require('../models/user');
require('dotenv').config();

async function resetDatabase() {
  try {
    // Drop tables
    await User.dropTable();
    console.log('✅ All tables dropped successfully');

    // Recreate tables
    await User.initTable();
    console.log('✅ All tables recreated successfully');

    console.log('✅ Database reset complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 