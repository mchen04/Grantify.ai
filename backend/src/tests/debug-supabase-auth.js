// Debug script to test Supabase authentication and permissions
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
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      // Set the Authorization header to use the service role key
      Authorization: `Bearer ${supabaseServiceKey}`
    }
  }
});

// Function to test querying the grants table
async function testGrantsAccess() {
  console.log('Testing access to grants table with service_role key...');
  
  try {
    // Test 1: Simple SELECT query
    console.log('\nTest 1: Simple SELECT query');
    const { data: grants, error } = await supabase
      .from('grants')
      .select('id, title')
      .limit(1);
    
    if (error) {
      console.error('Error accessing grants table:', error);
    } else {
      console.log('Successfully accessed grants table!');
      console.log('Sample data:', grants);
    }

    // Test 2: Check auth context
    console.log('\nTest 2: Check auth context');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Error getting auth session:', authError);
    } else {
      console.log('Auth session:', authData);
    }

    // Test 3: Check auth role
    console.log('\nTest 3: Check auth role using RPC');
    const { data: roleData, error: roleError } = await supabase.rpc('get_auth_role');
    
    if (roleError) {
      console.error('Error getting auth role:', roleError);
      console.log('Note: You may need to create the get_auth_role function in your database');
    } else {
      console.log('Current auth role:', roleData);
    }

    // Test 4: Try to insert a test record
    console.log('\nTest 4: Try to insert a test record');
    const testId = 'test-' + Date.now();
    const { data: insertData, error: insertError } = await supabase
      .from('grants')
      .insert({
        opportunity_id: testId,
        title: 'Test Grant',
        description_short: 'This is a test grant created by the debug script'
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting test record:', insertError);
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
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Create the get_auth_role function if it doesn't exist
async function createRoleFunction() {
  console.log('Creating get_auth_role function if it doesn\'t exist...');
  
  try {
    // Try to create the function using a raw query
    const { error: createError } = await supabase
      .from('_temp_function_creator')
      .insert({ dummy: 'value' })
      .select()
      .limit(1)
      .abortSignal(new AbortController().signal); // This will fail, but we're just using it to check permissions
    
    console.log('Note: We cannot directly create SQL functions through the JS client.');
    console.log('You may need to create this function in your database manually:');
    console.log(`
      CREATE OR REPLACE FUNCTION get_auth_role()
      RETURNS TEXT AS $$
      BEGIN
        RETURN auth.role();
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `);
    
    // Skip function creation for now and proceed with tests
    console.log('Skipping function creation and proceeding with tests...');
  } catch (error) {
    console.error('Error in function creation step:', error);
    console.log('Proceeding with tests anyway...');
  }
}

// Main function
async function main() {
  console.log('=== Supabase Authentication and Permissions Debug ===');
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Service Key: ${supabaseServiceKey.substring(0, 10)}...`);
  
  // Create the role function
  await createRoleFunction();
  
  // Test grants access
  await testGrantsAccess();
}

// Run the main function
main()
  .catch(error => {
    console.error('Error in main function:', error);
  })
  .finally(() => {
    console.log('\nDebug script completed.');
  });