#!/usr/bin/env ts-node

const { default: seedDatabaseFn } = require('../lib/seed');

// Run the seed function
seedDatabaseFn()
  .then(() => {
    console.log('Seeding complete!');
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  }); 