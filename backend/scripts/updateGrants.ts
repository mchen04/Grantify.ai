/**
 * Script to manually run the grants update job
 * 
 * Usage: ts-node scripts/updateGrants.ts
 */

// Load environment variables
import 'dotenv/config';
import { runGrantsUpdateJob } from '../src/utils/cronJobs';

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