#!/usr/bin/env node

import Database from '../src/db/database';
import DatabaseMigrations from '../src/db/migrations';
import dotenv from 'dotenv';

dotenv.config();

async function setupDatabase() {
  const db = new Database();
  
  try {
    console.log('🚀 Setting up Cooksey Plate database...');
    
    // Connect to database
    await db.connect();
    
    // Run migrations
    const migrations = new DatabaseMigrations(db);
    await migrations.runMigrations();
    
    // Verify setup
    await migrations.verifySetup();
    
    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run Squiggle API integration to populate games');
    console.log('2. Import historical data from Excel');
    console.log('3. Start the backend server');
    
  } catch (error) {
    console.error('💥 Database setup failed:', error);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;