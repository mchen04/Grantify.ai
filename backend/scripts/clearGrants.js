/**
 * Script to clear all grants from the database
 * 
 * Usage: node scripts/clearGrants.js
 */

// Load environment variables
require('dotenv').config();

const supabase = require('../src/db/supabaseClient');

async function clearGrants() {
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
    console.error('Error during database cleanup:', error);
  }
}

// Run the cleanup
clearGrants()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });