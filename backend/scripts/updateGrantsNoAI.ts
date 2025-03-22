/**
 * Script to manually run the grants update job with real data from Grants.gov
 * This version uses basic text cleaning without AI
 *
 * Usage: ts-node scripts/updateGrantsNoAI.ts
 */

import 'dotenv/config';
import { runGrantsUpdateJob } from '../src/utils/cronJobs';
import { basicTextCleaner } from '../src/utils/basicTextCleaner';

// Run the grants update job with useMock set to false and basic text cleaner
console.log('Starting manual grants update with LIVE data from Grants.gov (No AI)...');
console.log('This will attempt to download the latest XML extract from Grants.gov.');
console.log('If the download fails, it will try previous days until it finds a valid file.');

runGrantsUpdateJob(false, basicTextCleaner)
  .then(() => {
    console.log('Manual grants update with LIVE data completed (No AI).');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error running manual grants update with LIVE data:', error instanceof Error ? error.message : error);
    process.exit(1);
  });