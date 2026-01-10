// Using built-in fetch (Node.js 18+)

async function testSyncAPI() {
    try {
        console.log('🔄 Testing operator sync API...');
        
        // First, let's test without authentication to see the error
        console.log('📋 Testing without authentication...');
        let response = await fetch('http://localhost:3000/api/recharge/sync-all-operators', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        let data = await response.json();
        console.log('📊 Response Status (no auth):', response.status);
        console.log('📋 Response Data (no auth):', JSON.stringify(data, null, 2));
        
        if (response.status === 401) {
            console.log('✅ Authentication check working correctly - got 401 Unauthorized');
        }

        console.log('\n📝 Note: To test the actual sync, you need to be logged in as an admin user.');
        console.log('� You canp test this through the admin dashboard at: http://localhost:3000/dashboard/admin/kwikapi-wallet');
        
    } catch (error) {
        console.error('💥 Error testing sync API:', error.message);
    }
}

// Also create a function to check current database state
async function checkDatabaseState() {
    try {
        console.log('📊 Checking current database state...');
        
        const response = await fetch('http://localhost:3000/api/recharge/operators', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('📈 Current operators count:', data.length || 'Unknown');
            
            // Group by service type
            const serviceGroups = {};
            if (Array.isArray(data)) {
                data.forEach(op => {
                    serviceGroups[op.service_type] = (serviceGroups[op.service_type] || 0) + 1;
                });
                
                console.log('📋 Operators by service type:');
                Object.entries(serviceGroups).forEach(([service, count]) => {
                    console.log(`  ${service}: ${count}`);
                });
            }
        } else {
            console.log('❌ Failed to fetch operators:', response.status);
        }
        
    } catch (error) {
        console.error('💥 Error checking database state:', error.message);
    }
}

// Run both functions
async function runTests() {
    await checkDatabaseState();
    console.log('\n' + '='.repeat(50) + '\n');
    await testSyncAPI();
}

runTests();