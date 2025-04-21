/**
 * Script to clear all grants and related data from the database
 * Handles foreign key constraints by deleting in the correct order
 * 
 * Usage: ts-node scripts/clearAllData.ts
 */

import 'dotenv/config';
import supabase from '../src/db/supabaseClient';

async function clearAllData(): Promise<void> {
  try {
    console.log('Starting complete database cleanup...');
    
    // Step 1: Delete all user interactions first (these reference grants)
    console.log('Deleting all user interactions...');
    const { error: interactionsError } = await supabase
      .from('user_interactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (interactionsError) {
      console.error('Error deleting user interactions:', interactionsError);
    } else {
      console.log('All user interactions deleted successfully');
    }
    
    // Step 2: Delete all grants
    console.log('Deleting all grants...');
    const { error: grantsError } = await supabase
      .from('grants')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (grantsError) {
      console.error('Error deleting grants:', grantsError);
    } else {
      console.log('All grants deleted successfully');
    }
    
    // Step 3: Delete all pipeline runs
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
    
    console.log('Complete database cleanup completed');
  } catch (error) {
    console.error('Error during database cleanup:', error instanceof Error ? error.message : error);
  }
}

// Run the cleanup
clearAllData()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Cleanup script failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });