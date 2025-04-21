/**
 * Script to manually run the grants update job with real data from Grants.gov
 * Uses OpenRouter for text cleaning
 *
 * Usage: ts-node scripts/updateGrantsLive.ts [--source=grants.gov]
 */

import 'dotenv/config';
import { runGrantsUpdateJob } from '../src/utils/cronJobs';
import { textCleaner } from '../src/utils/textCleaner';

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

// Run the grants update job with useMock set to false to force a real download
console.log(`Starting manual grants update with LIVE data from ${source}...`);
console.log('This will attempt to download the latest XML extract from Grants.gov.');
console.log('If the download fails, it will try previous days until it finds a valid file.');
console.log('Using OpenRouter for text cleaning.');

runGrantsUpdateJob(false, textCleaner, source)
  .then(() => {
    console.log(`Manual grants update with LIVE data from ${source} completed.`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(`Error running manual grants update with LIVE data from ${source}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  });