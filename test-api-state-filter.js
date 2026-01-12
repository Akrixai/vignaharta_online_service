// Simple test to check if the API state filtering is working
const testAPI = async () => {
  console.log('🧪 Testing API State Filtering...\n');

  const baseURL = 'http://localhost:3000'; // Adjust if different

  try {
    // Test 1: Get all services
    console.log('1️⃣ Testing: All services');
    const allResponse = await fetch(`${baseURL}/api/services`);
    if (allResponse.ok) {
      const allData = await allResponse.json();
      console.log(`   ✅ Total services: ${allData.services?.length || 0}`);
    } else {
      console.log(`   ❌ Error: ${allResponse.status} ${allResponse.statusText}`);
    }

    // Test 2: Filter by UP
    console.log('\n2️⃣ Testing: UP filter');
    const upResponse = await fetch(`${baseURL}/api/services?state=UP`);
    if (upResponse.ok) {
      const upData = await upResponse.json();
      console.log(`   ✅ UP services: ${upData.services?.length || 0}`);
      
      if (upData.services && upData.services.length > 0) {
        console.log('   📍 Services for UP:');
        upData.services.forEach(service => {
          console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${upResponse.status} ${upResponse.statusText}`);
    }

    // Test 3: Filter by MH (should show different services)
    console.log('\n3️⃣ Testing: MH filter');
    const mhResponse = await fetch(`${baseURL}/api/services?state=MH`);
    if (mhResponse.ok) {
      const mhData = await mhResponse.json();
      console.log(`   ✅ MH services: ${mhData.services?.length || 0}`);
      
      if (mhData.services && mhData.services.length > 0) {
        console.log('   📍 Services for MH:');
        mhData.services.forEach(service => {
          console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
        });
      }
    } else {
      console.log(`   ❌ Error: ${mhResponse.status} ${mhResponse.statusText}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }

  console.log('\n🏁 Test completed!');
};

// Check if we're in Node.js environment
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with fetch support or a browser environment');
  console.log('💡 Try running: node --version (should be 18+)');
} else {
  testAPI().catch(console.error);
}