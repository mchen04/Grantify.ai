/**
 * Script to clean up expired grants from the database
 * 
 * Usage: node scripts/cleanupExpiredGrants.js
 */

// Load environment variables
require('dotenv').config();

const supabase = require('../src/db/supabaseClient');

async function cleanupExpiredGrants() {
  try {
    console.log('Starting expired grants cleanup...');
    
    // Get current date
    const today = new Date().toISOString();
    
    // Count expired grants
    const { count, error: countError } = await supabase
      .from('grants')
      .select('*', { count: 'exact' })
      .lt('close_date', today);
    
    if (countError) {
      console.error('Error counting expired grants:', countError);
      return;
    }
    
    console.log(`Found ${count} expired grants to clean up`);
    
    if (count === 0) {
      console.log('No expired grants to clean up');
      return;
    }
    
    // Delete expired grants
    console.log('Deleting expired grants...');
    const { error: deleteError } = await supabase
      .from('grants')
      .delete()
      .lt('close_date', today);
    
    if (deleteError) {
      console.error('Error deleting expired grants:', deleteError);
    } else {
      console.log(`Successfully deleted ${count} expired grants`);
    }
    
    // Also clean up any user interactions with expired grants
    console.log('Cleaning up user interactions with expired grants...');
    
    // This is a more complex operation that would require a join or a function in Supabase
    // For now, we'll just log that this would be done in a production environment
    console.log('Note: In a production environment, you would also clean up user interactions with expired grants');
    
    console.log('Expired grants cleanup completed');
  } catch (error) {
    console.error('Error during expired grants cleanup:', error);
  }
}

// Run the cleanup
cleanupExpiredGrants()
  .then(() => {
    console.log('Cleanup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup script failed:', error);
    process.exit(1);
  });