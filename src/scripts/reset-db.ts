#!/usr/bin/env ts-node

import initializeDatabase from '../lib/initialize-db';
import seedDatabase from '../lib/seed';

// Run the initialization function followed by seeding
async function resetAndSeedDatabase() {
  try {
    console.log('Starting database reset and seed process...');
    
    // First initialize (drop and recreate tables)
    await initializeDatabase();
    
    // Then seed with fresh data
    await seedDatabase();
    
    console.log('Database reset and seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during database reset and seed:', error);
    process.exit(1);
  }
}

// Using top-level await in ES module
await resetAndSeedDatabase();
