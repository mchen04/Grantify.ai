/**
 * Script to manually run the grants update job with real data from Grants.gov
 * 
 * Usage: ts-node scripts/updateGrantsLive.ts
 */

import 'dotenv/config';
import { runGrantsUpdateJob } from '../src/utils/cronJobs';

// Run the grants update job with useMock set to false to force a real download
console.log('Starting manual grants update with LIVE data from Grants.gov...');
console.log('This will attempt to download the latest XML extract from Grants.gov.');
console.log('If the download fails, it will try previous days until it finds a valid file.');

runGrantsUpdateJob(false)
  .then(() => {
    console.log('Manual grants update with LIVE data completed.');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Error running manual grants update with LIVE data:', error instanceof Error ? error.message : error);
    process.exit(1);
  });