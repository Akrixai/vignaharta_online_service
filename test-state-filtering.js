// Test script to verify state filtering is working
const testStateFiltering = async () => {
  console.log('🧪 Testing State Filtering...\n');

  // Test 1: Get all services (no state filter)
  console.log('1️⃣ Testing: All services (no state filter)');
  try {
    const allResponse = await fetch('http://localhost:3000/api/services');
    const allData = await allResponse.json();
    console.log(`   ✅ Total services: ${allData.services?.length || 0}`);
    
    // Show available states for first few services
    if (allData.services && allData.services.length > 0) {
      console.log('   📍 Sample service states:');
      allData.services.slice(0, 5).forEach(service => {
        console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n');

  // Test 2: Filter by Maharashtra (MH)
  console.log('2️⃣ Testing: Maharashtra (MH) filter');
  try {
    const mhResponse = await fetch('http://localhost:3000/api/services?state=MH');
    const mhData = await mhResponse.json();
    console.log(`   ✅ Maharashtra services: ${mhData.services?.length || 0}`);
    
    if (mhData.services && mhData.services.length > 0) {
      console.log('   📍 Maharashtra services:');
      mhData.services.forEach(service => {
        console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n');

  // Test 3: Filter by Delhi (DL)
  console.log('3️⃣ Testing: Delhi (DL) filter');
  try {
    const dlResponse = await fetch('http://localhost:3000/api/services?state=DL');
    const dlData = await dlResponse.json();
    console.log(`   ✅ Delhi services: ${dlData.services?.length || 0}`);
    
    if (dlData.services && dlData.services.length > 0) {
      console.log('   📍 Delhi services:');
      dlData.services.forEach(service => {
        console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n');

  // Test 4: Filter by Tamil Nadu (TN)
  console.log('4️⃣ Testing: Tamil Nadu (TN) filter');
  try {
    const tnResponse = await fetch('http://localhost:3000/api/services?state=TN');
    const tnData = await tnResponse.json();
    console.log(`   ✅ Tamil Nadu services: ${tnData.services?.length || 0}`);
    
    if (tnData.services && tnData.services.length > 0) {
      console.log('   📍 Tamil Nadu services:');
      tnData.services.forEach(service => {
        console.log(`      - ${service.name}: [${service.available_states?.join(', ') || 'N/A'}]`);
      });
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  console.log('\n🏁 Test completed!');
};

// Run the test
testStateFiltering().catch(console.error);