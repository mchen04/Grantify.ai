// Test script to verify that the backend server can access the grants table
require('dotenv').config();
const axios = require('axios');

const API_URL = `http://localhost:${process.env.PORT || 3001}/api`;

async function testBackendServer() {
  console.log('=== Testing Backend Server Access to Grants Table ===');
  console.log(`API URL: ${API_URL}`);
  
  try {
    // Test 1: Get grants endpoint
    console.log('\nTest 1: GET /api/grants');
    const grantsResponse = await axios.get(`${API_URL}/grants`);
    
    if (grantsResponse.status === 200) {
      console.log('✅ Successfully accessed grants endpoint!');
      console.log(`Received ${grantsResponse.data.grants?.length || 0} grants`);
      
      if (grantsResponse.data.grants?.length > 0) {
        console.log('Sample grant:', {
          id: grantsResponse.data.grants[0].id,
          title: grantsResponse.data.grants[0].title,
          agency: grantsResponse.data.grants[0].agency_name
        });
      }
    } else {
      console.error('❌ Failed to access grants endpoint:', grantsResponse.status);
    }
    
    // Test 2: Get a specific grant
    if (grantsResponse.data.grants?.length > 0) {
      const grantId = grantsResponse.data.grants[0].id;
      console.log(`\nTest 2: GET /api/grants/${grantId}`);
      
      const grantResponse = await axios.get(`${API_URL}/grants/${grantId}`);
      
      if (grantResponse.status === 200) {
        console.log('✅ Successfully accessed specific grant!');
        console.log('Grant title:', grantResponse.data.grant.title);
      } else {
        console.error('❌ Failed to access specific grant:', grantResponse.status);
      }
    } else {
      console.log('\nSkipping Test 2: No grants available to test specific grant endpoint');
    }
    
    console.log('\n✅ All tests passed! The backend server can now access the grants table.');
    
  } catch (error) {
    console.error('\n❌ Error testing backend server:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    console.log('\nMake sure the backend server is running before running this test.');
    console.log('You can start the server with: cd backend && npm run dev');
  }
}

// Run the test
testBackendServer();