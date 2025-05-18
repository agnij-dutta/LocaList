#!/usr/bin/env ts-node

const { getDb } = require('../lib/db');

async function validateDatabase() {
  try {
    console.log('Validating database integrity...');
    
    const db = await getDb();
    
    // Check if tables exist
    const tables = await db.all(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    console.log(`Found ${tables.length} tables:`);
    tables.forEach((table: { name: string }) => {
      console.log(`- ${table.name}`);
    });
    
    // Count records in each table
    for (const table of tables) {
      const count = await db.get(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  ${table.name}: ${count.count} records`);
    }
    
    console.log('Database validation completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('Error during database validation:', error.message);
    process.exit(1);
  }
}

validateDatabase(); 