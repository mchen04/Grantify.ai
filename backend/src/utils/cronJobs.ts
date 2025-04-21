import * as cron from 'node-cron';
import { downloadGrantsXml } from './grantsDownloader';
import { parseGrantsXml } from './grantsParser';
import grantsService from '../services/grantsService';
import { textCleaner } from './textCleaner';
import { geminiTextCleaner } from './geminiTextCleaner';

// Interface for text cleaner
interface TextCleaner {
  processGrantData(data: {
    description: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
  }): Promise<{
    description: string;
    contactInfo: {
      name: string | null;
      email: string | null;
      phone: string | null;
    };
  }>;
}

interface PipelineStats {
  total: number;
  new: number;
  updated: number;
  unchanged: number;
  failed: number;
  startTime: Date;
  endTime: Date;
}

/**
 * Initialize cron jobs
 */
export function initCronJobs(): void {
  // Schedule the grants update job to run at 5 AM daily
  // Cron format: second(optional) minute hour day-of-month month day-of-week
  cron.schedule('0 5 * * *', async () => {
    console.log('Running grants update job...');
    await updateGrantsData(false, geminiTextCleaner); // Using Gemini for text cleaning
  }, {
    scheduled: true,
    timezone: 'America/New_York' // 5 AM EST as specified
  });
  
  console.log('Cron jobs initialized. Grants update scheduled for 5 AM EST daily.');
  console.log('Using Gemini for text cleaning.');
}

/**
 * Update grants data from Grants.gov
 * @param useMock - Whether to use the mock XML file (for testing)
 * @param customTextCleaner - Optional custom text cleaner to use
 * @param source - Source of the grant data (default: 'grants.gov')
 */
export async function updateGrantsData(useMock = false, customTextCleaner?: TextCleaner, source: string = 'grants.gov'): Promise<void> {
  try {
    console.log('Starting grants data update process...');
    
    // Step 1: Download the latest XML extract
    const xmlPath = await downloadGrantsXml({ date: new Date(), useV2: true, useMock });
    console.log(`Using XML file at ${xmlPath}`);
    
    // Step 2: Get existing grant IDs
    const existingGrantIds = await grantsService.getAllGrantIds();
    console.log(`Found ${existingGrantIds.length} existing grants in database`);

    // Step 3: Parse the XML data, skipping text cleaning for existing grants
    const grants = await parseGrantsXml(xmlPath, existingGrantIds, customTextCleaner);
    
    // Set the source for all grants
    grants.forEach(grant => {
      grant.source = source;
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

/**
 * Run the grants update job manually
 * @param useMock - Whether to use the mock XML file (for testing)
 * @param customTextCleaner - Optional custom text cleaner to use
 * @param source - Source of the grant data (default: 'grants.gov')
 */
export async function runGrantsUpdateJob(useMock = true, customTextCleaner?: TextCleaner, source: string = 'grants.gov'): Promise<void> {
  console.log(`Manually running grants update job for source: ${source}...`);
  await updateGrantsData(useMock, customTextCleaner, source);
}