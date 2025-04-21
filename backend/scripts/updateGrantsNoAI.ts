/**
 * Script to manually run the grants update job with real data from Grants.gov
 * This version uses basic text cleaning without AI
 *
 * Usage: ts-node scripts/updateGrantsNoAI.ts [--source=grants.gov]
 */

import 'dotenv/config';
import { runGrantsUpdateJob } from '../src/utils/cronJobs';
import { basicTextCleaner } from '../src/utils/basicTextCleaner';

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  let source = 'grants.gov'; // Default source
  
  args.forEach(arg => {
    if (arg.startsWith('--source=')) {
      source = arg.split('=')[1];
    }
  });
  
  return { source };
}

const { source } = parseArgs();

// Run the grants update job with useMock set to false and basic text cleaner
console.log(`Starting manual grants update with LIVE data from ${source} (No AI)...`);
console.log('This will attempt to download the latest XML extract from Grants.gov.');
console.log('If the download fails, it will try previous days until it finds a valid file.');
console.log('Using basic text cleaning without AI.');

runGrantsUpdateJob(false, basicTextCleaner, source)
  .then(() => {
    console.log(`Manual grants update with LIVE data from ${source} completed (No AI).`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(`Error running manual grants update with LIVE data from ${source}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  });