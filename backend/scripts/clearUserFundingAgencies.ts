/**
 * Script to clear all user funding agency preferences from the database
 * 
 * Usage: ts-node scripts/clearUserFundingAgencies.ts
 */

import 'dotenv/config';
import supabase from '../src/db/supabaseClient';

async function clearUserFundingAgencies(): Promise<void> {
  try {
    console.log('Starting user funding agencies cleanup...');
    
    // Update all records in the user_preferences table to set agencies to an empty array
    console.log('Clearing all user funding agency preferences...');
    const { data, error, count } = await supabase
      .from('user_preferences')
      .update({ 
        agencies: [],
        updated_at: new Date().toISOString()
      })
      .neq('user_id', '00000000-0000-0000-0000-000000000000') // This ensures we update all records
      .select('user_id');
    
    if (error) {
      console.error('Error clearing user funding agency preferences:', error);
    } else {
      console.log(`Successfully cleared funding agency preferences for ${data?.length || 0} users`);
    }
    
    console.log('User funding agencies cleanup completed');
  } catch (error) {
    console.error('Error during user funding agencies cleanup:', error instanceof Error ? error.message : error);
  }
}

// Run the cleanup
clearUserFundingAgencies()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Cleanup script failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });