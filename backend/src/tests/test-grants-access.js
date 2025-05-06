// Test script to verify grants table access
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Log environment variables for debugging
console.log('Environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Found' : 'Not found');
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Found (hidden)' : 'Not found');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client with service role key and explicit auth context
// Using the most direct approach to bypass RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      // Set the Authorization header to use the service role key
      Authorization: `Bearer ${supabaseServiceKey}`,
      // Explicitly set the role to service_role
      'X-Client-Info': 'service_role'
    }
  }
});

// Log that we're using the service role key
console.log('Supabase client initialized with service_role key');

// Function to test grants table access
async function testGrantsAccess() {
  console.log('Testing access to grants table...');
  
  try {
    // Test 1: Simple SELECT query
    console.log('\nTest 1: Simple SELECT query');
    const { data: grants, error } = await supabase
      .from('grants')
      .select('id, title')
      .limit(5);
    
    if (error) {
      console.error('Error accessing grants table:', error);
      return false;
    } else {
      console.log('Successfully accessed grants table!');
      console.log('Sample data:', grants);
      
      // Test 2: Try to insert a test record
      console.log('\nTest 2: Try to insert a test record');
      const testId = 'test-' + Date.now();
      const { data: insertData, error: insertError } = await supabase
        .from('grants')
        .insert({
          opportunity_id: testId,
          title: 'Test Grant',
          description_short: 'This is a test grant created by the test script'
        })
        .select();
      
      if (insertError) {
        console.error('Error inserting test record:', insertError);
        return false;
      } else {
        console.log('Successfully inserted test record!');
        console.log('Inserted data:', insertData);
        
        // Clean up the test record
        const { error: deleteError } = await supabase
          .from('grants')
          .delete()
          .eq('opportunity_id', testId);
        
        if (deleteError) {
          console.error('Error deleting test record:', deleteError);
        } else {
          console.log('Successfully deleted test record!');
        }
        
        return true;
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== Grants Table Access Test ===');
  
  const success = await testGrantsAccess();
  
  if (success) {
    console.log('\n✅ All tests passed! The backend can now access the grants table.');
  } else {
    console.log('\n❌ Tests failed. The backend still cannot access the grants table.');
  }
}

// Run the main function
main()
  .catch(error => {
    console.error('Error in main function:', error);
  })
  .finally(() => {
    console.log('\nTest script completed.');
  });