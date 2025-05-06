// Test script to verify API connection and database permissions
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Try different host configurations
const hostConfigs = [
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://0.0.0.0:3001'
];

async function testBackendAPI() {
  let connected = false;
  
  console.log('Testing backend API connection...');
  
  // Try each host configuration
  for (const baseUrl of hostConfigs) {
    try {
      console.log(`\nTrying ${baseUrl}...`);
      
      // Test the root endpoint
      console.log('1. Testing root endpoint:');
      const rootResponse = await axios.get(`${baseUrl}/`);
      console.log(`Status: ${rootResponse.status}`);
      console.log(`Response: ${JSON.stringify(rootResponse.data).substring(0, 100)}...`);
      
      // If we get here, we've successfully connected
      connected = true;
      
      // Test the grants endpoint
      console.log('\n2. Testing grants endpoint:');
      try {
        const grantsResponse = await axios.get(`${baseUrl}/api/grants`);
        console.log(`Status: ${grantsResponse.status}`);
        console.log(`Retrieved ${grantsResponse.data.grants?.length || 0} grants`);
      } catch (error) {
        console.log(`Status: ${error.response?.status || 'Unknown'}`);
        console.log('Error:', error.response?.data || error.message);
      }
      
      // We've found a working host, so break out of the loop
      break;
    } catch (error) {
      console.log(`Could not connect to ${baseUrl}: ${error.message}`);
    }
  }
  
  if (!connected) {
    console.error('\nFailed to connect to the backend server on any host configuration.');
    console.error('Please ensure the backend server is running on port 3001.');
  }
}

async function testSupabaseConnection() {
  try {
    console.log('\n3. Testing direct Supabase connection:');
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
    console.error('Supabase connection test failed:', error);
  }
}

// Run the tests
async function runTests() {
  await testBackendAPI();
  await testSupabaseConnection();
}

runTests();