/**
 * Test script to verify axios deprecation warning suppression
 */

console.log('Testing axios deprecation warning suppression...');

// Import our wrapped axios
const axios = require('./src/lib/axios-wrapper.ts');

// Make a simple HTTP request that might trigger url.parse()
async function testAxios() {
  try {
    console.log('Making HTTP request...');
    const response = await axios.get('https://httpbin.org/get');
    console.log('✅ Request successful, status:', response.status);
    console.log('✅ No deprecation warnings should appear above this line');
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testAxios();