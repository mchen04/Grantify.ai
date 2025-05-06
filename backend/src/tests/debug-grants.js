// Debug script to test the grants endpoint with detailed error logging
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testGrantsQuery() {
  try {
    console.log('Testing grants query...');
    console.log('Using Supabase URL:', supabaseUrl);
    console.log('Using Supabase Key (first 10 chars):', supabaseKey.substring(0, 10) + '...');
    
    // Test a simple query to the grants table
    const { data, error } = await supabase
      .from('grants')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error querying grants table:', error);
      return;
    }
    
    console.log('Successfully queried grants table!');
    console.log(`Retrieved ${data.length} grants`);
    
    if (data.length > 0) {
      console.log('First grant:', {
        id: data[0].id,
        title: data[0].title,
        opportunity_id: data[0].opportunity_id
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testGrantsQuery();