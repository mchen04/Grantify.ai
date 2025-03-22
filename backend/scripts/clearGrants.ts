/**
 * Script to clear all grants from the database
 * 
 * Usage: ts-node scripts/clearGrants.ts
 */

import 'dotenv/config';
import supabase from '../src/db/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';

async function clearGrants(): Promise<void> {
  try {
    console.log('Starting grants cleanup...');
    
    // Delete all records from the grants table
    console.log('Deleting all grants...');
    const { error: grantsError } = await supabase
      .from('grants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // This is a trick to delete all records
    
    if (grantsError) {
      console.error('Error deleting grants:', grantsError);
    } else {
      console.log('All grants deleted successfully');
    }
    
    // Also delete all pipeline runs for a clean slate
    console.log('Deleting all pipeline runs...');
    const { error: pipelineError } = await supabase
      .from('pipeline_runs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (pipelineError) {
      console.error('Error deleting pipeline runs:', pipelineError);
    } else {
      console.log('All pipeline runs deleted successfully');
    }
    
    console.log('Database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error instanceof Error ? error.message : error);
  }
}

// Run the cleanup
clearGrants()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Cleanup script failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });