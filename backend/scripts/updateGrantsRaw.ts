/**
 * Script to manually run the grants update job with real data from Grants.gov
 * This version skips ALL text cleaning and sends raw data directly to the database
 *
 * Usage: ts-node scripts/updateGrantsRaw.ts [--source=grants.gov]
 */

import 'dotenv/config';
import { downloadGrantsXml } from '../src/utils/grantsDownloader';
import { parseGrantsXml } from '../src/utils/grantsParser';
import grantsService from '../src/services/grantsService';

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

// Create a raw text cleaner that does absolutely no cleaning
const rawTextCleaner = {
  processGrantData: async (data: {
    description: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }) => {
    return {
      description: data.description,
      contactInfo: {
        name: data.contactName || null,
        email: data.contactEmail || null,
        phone: data.contactPhone || null
      }
    };
  }
};

/**
 * Run the grants update job with raw data (no text cleaning)
 */
async function runRawGrantsUpdateJob(useMock = false, source = 'grants.gov'): Promise<void> {
  try {
    console.log(`Starting grants data update process with RAW data from ${source}...`);
    
    // Step 1: Download the latest XML extract
    const xmlPath = await downloadGrantsXml({ date: new Date(), useV2: true, useMock });
    console.log(`Using XML file at ${xmlPath}`);
    
    // Step 2: Get existing grant IDs
    const existingGrantIds = await grantsService.getAllGrantIds();
    console.log(`Found ${existingGrantIds.length} existing grants in database`);

    // Step 3: Parse the XML data with NO text cleaning
    const grants = await parseGrantsXml(xmlPath, existingGrantIds, rawTextCleaner);
    
    // Set the source for all grants
    grants.forEach(grant => {
      grant.source = source;
      grant.processing_status = 'not_processed'; // Use allowed value from check constraint
    });
    console.log(`Parsed ${grants.length} grants from XML`);
    
    // Step 4: Store the grants in the database
    const result = await grantsService.storeGrants(grants);
    
    // Log the results
    console.log('Grants update completed successfully:');
    console.log(`- Total grants processed: ${result.total}`);
    console.log(`- New grants added: ${result.new}`);
    console.log(`- Existing grants updated: ${result.updated}`);
    console.log(`- Unchanged grants: ${result.unchanged}`);
    console.log(`- Failed grants: ${result.failed}`);
    console.log(`- Duration: ${(result.endTime.getTime() - result.startTime.getTime()) / 1000} seconds`);
  } catch (error) {
    console.error('Error updating grants data:', error instanceof Error ? error.message : error);
    throw error;
  }
}

const { source } = parseArgs();

// Run the grants update job with useMock set to false to force a real download
console.log(`Starting manual grants update with RAW data from ${source}...`);
console.log('This will attempt to download the latest XML extract from Grants.gov.');
console.log('If the download fails, it will try previous days until it finds a valid file.');
console.log('NO text cleaning will be performed - raw data will be sent directly to the database.');

runRawGrantsUpdateJob(false, source)
  .then(() => {
    console.log(`Manual grants update with RAW data from ${source} completed.`);
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error(`Error running manual grants update with RAW data from ${source}:`, error instanceof Error ? error.message : error);
    process.exit(1);
  });