/**
 * Script to process grants using the Gemini API with rate limiting
 * 
 * This script:
 * 1. Processes grants in chunks
 * 2. Stops when it hits a rate limit
 * 3. Marks entries as "processed" once completed
 * 4. Leaves others as "not_processed" so the next run resumes from the correct point
 * 
 * Usage: ts-node scripts/updateGrantsWithGemini.ts [--chunk-size=50] [--max-requests=100]
 */

import 'dotenv/config';
import supabase from '../src/db/supabaseClient';
import { geminiTextCleaner } from '../src/utils/geminiTextCleaner';
import { TransformedGrant } from '../src/utils/grantsParser';

// Default configuration
const DEFAULT_CHUNK_SIZE = 50;
const DEFAULT_MAX_REQUESTS = 100; // Default max requests per run

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const config: { chunkSize: number; maxRequests: number } = {
    chunkSize: DEFAULT_CHUNK_SIZE,
    maxRequests: DEFAULT_MAX_REQUESTS
  };

  args.forEach(arg => {
    if (arg.startsWith('--chunk-size=')) {
      const size = parseInt(arg.split('=')[1], 10);
      if (!isNaN(size) && size > 0) {
        config.chunkSize = size;
      }
    } else if (arg.startsWith('--max-requests=')) {
      const max = parseInt(arg.split('=')[1], 10);
      if (!isNaN(max) && max > 0) {
        config.maxRequests = max;
      }
    }
  });

  return config;
}

/**
 * Process a single grant with Gemini
 */
async function processGrant(grant: any): Promise<{ success: boolean; error?: any }> {
  try {
    console.log(`Processing grant: ${grant.opportunity_id} - ${grant.title}`);
    
    // Process the grant data with Gemini
    const cleanedData = await geminiTextCleaner.processGrantData({
      description: grant.description || '',
      contactName: grant.grantor_contact_name || '',
      contactEmail: grant.grantor_contact_email || '',
      contactPhone: grant.grantor_contact_phone || ''
    });
    
    // Update the grant with cleaned data and mark as processed
    const { error } = await supabase
      .from('grants')
      .update({
        description: cleanedData.description,
        grantor_contact_name: cleanedData.contactInfo.name || grant.grantor_contact_name,
        grantor_contact_email: cleanedData.contactInfo.email || grant.grantor_contact_email,
        grantor_contact_phone: cleanedData.contactInfo.phone || grant.grantor_contact_phone,
        processing_status: 'processed',
        updated_at: new Date().toISOString()
      })
      .eq('id', grant.id);
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error(`Error processing grant ${grant.opportunity_id}:`, error);
    return { success: false, error };
  }
}

/**
 * Get unprocessed grants from the database
 */
async function getUnprocessedGrants(chunkSize: number): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('grants')
      .select('*')
      .eq('processing_status', 'not_processed')
      .order('created_at', { ascending: true })
      .limit(chunkSize);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching unprocessed grants:', error);
    return [];
  }
}

/**
 * Record pipeline run statistics
 */
async function recordPipelineRun(stats: {
  total: number;
  processed: number;
  failed: number;
  startTime: Date;
  endTime: Date;
  error?: string;
}): Promise<void> {
  try {
    const { error } = await supabase
      .from('pipeline_runs')
      .insert({
        status: stats.error ? 'failed' : 'completed',
        details: {
          type: 'gemini_processing',
          total: stats.total,
          processed: stats.processed,
          failed: stats.failed,
          duration_ms: stats.endTime.getTime() - stats.startTime.getTime(),
          error: stats.error,
        },
        timestamp: new Date().toISOString(),
      });
    
    if (error) throw error;
    
    console.log('Pipeline run recorded successfully');
  } catch (error) {
    console.error('Error recording pipeline run:', error);
  }
}

/**
 * Main function to process grants in chunks
 */
async function processGrantsWithGemini(): Promise<void> {
  const config = parseArgs();
  console.log(`Starting Gemini grant processing with chunk size: ${config.chunkSize}, max requests: ${config.maxRequests}`);
  
  const stats = {
    total: 0,
    processed: 0,
    failed: 0,
    startTime: new Date(),
    endTime: new Date()
  };
  
  try {
    let requestCount = 0;
    let shouldContinue = true;
    
    while (shouldContinue) {
      // Get a chunk of unprocessed grants
      const grants = await getUnprocessedGrants(config.chunkSize);
      
      if (grants.length === 0) {
        console.log('No more unprocessed grants found. Exiting.');
        break;
      }
      
      console.log(`Processing chunk of ${grants.length} grants...`);
      stats.total += grants.length;
      
      // Process each grant in the chunk
      for (const grant of grants) {
        // Check if we've hit the max requests limit
        if (requestCount >= config.maxRequests) {
          console.log(`Reached maximum request limit (${config.maxRequests}). Stopping.`);
          shouldContinue = false;
          break;
        }
        
        // Process the grant
        const result = await processGrant(grant);
        requestCount++;
        
        if (result.success) {
          stats.processed++;
          console.log(`Successfully processed grant ${grant.opportunity_id} (${stats.processed}/${stats.total})`);
        } else {
          stats.failed++;
          console.error(`Failed to process grant ${grant.opportunity_id}`);
        }
      }
      
      // If we processed fewer grants than the chunk size, we're done
      if (grants.length < config.chunkSize) {
        console.log('Processed all available unprocessed grants.');
        shouldContinue = false;
      }
    }
    
    stats.endTime = new Date();
    const durationSeconds = (stats.endTime.getTime() - stats.startTime.getTime()) / 1000;
    
    console.log('\nGemini Grant Processing Summary:');
    console.log(`- Total grants processed: ${stats.total}`);
    console.log(`- Successfully processed: ${stats.processed}`);
    console.log(`- Failed: ${stats.failed}`);
    console.log(`- Duration: ${durationSeconds.toFixed(2)} seconds`);
    console.log(`- Requests made: ${requestCount}`);
    
    // Record the pipeline run
    await recordPipelineRun(stats);
    
  } catch (error) {
    console.error('Error in Gemini grant processing:', error);
    
    stats.endTime = new Date();
    await recordPipelineRun({
      ...stats,
      error: error instanceof Error ? error.message : String(error)
    });
    
    process.exit(1);
  }
}

// Run the main function
processGrantsWithGemini()
  .then(() => {
    console.log('Gemini grant processing completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Unhandled error in Gemini grant processing:', error);
    process.exit(1);
  });