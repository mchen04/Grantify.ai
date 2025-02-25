/**
 * Script to manually run the grants update job
 * 
 * Usage: node scripts/updateGrants.js
 */

// Load environment variables
require('dotenv').config();

const { runGrantsUpdateJob } = require('../src/utils/cronJobs');

// Run the grants update job
console.log('Starting manual grants update...');
runGrantsUpdateJob()
  .then(() => {
    console.log('Manual grants update completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error running manual grants update:', error);
    process.exit(1);
  });