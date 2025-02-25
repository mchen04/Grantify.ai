const http = require('http');

// Define the API endpoints to test
const endpoints = [
  { method: 'GET', path: '/' },
  { method: 'GET', path: '/api/grants' },
  { method: 'GET', path: '/api/grants/recommended?userId=test-user' },
  { method: 'GET', path: '/api/grants/123' },
  { method: 'GET', path: '/api/users/preferences?userId=test-user' }
];

// Function to make an HTTP request
function makeRequest(method, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    req.end();
  });
}

// Test all endpoints
async function testEndpoints() {
  console.log('Testing API endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.method} ${endpoint.path}...`);
      const response = await makeRequest(endpoint.method, endpoint.path);
      console.log(`Status: ${response.statusCode}`);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      console.log('-----------------------------------\n');
    } catch (error) {
      console.error(`Error testing ${endpoint.method} ${endpoint.path}:`, error.message);
      console.log('-----------------------------------\n');
    }
  }
}

// Wait for the server to start before testing
console.log('Waiting for server to start...');
setTimeout(() => {
  testEndpoints().catch(console.error);
}, 2000);