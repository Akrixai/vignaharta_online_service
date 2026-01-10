// Test script to directly call KwikAPI and compare with database

async function testKwikApiDirect() {
    try {
        console.log('🔄 Testing direct KwikAPI call...');
        
        // Using the API key from the .env file
        const kwikApiKey = '7f4a43-7c2711-25d253-4750d7-8bc5be';
        const kwikApiUrl = `https://www.kwikapi.com/api/v2/operator_codes.php?api_key=${kwikApiKey}`;
        
        console.log('📡 Calling KwikAPI...');
        console.log('🔗 URL:', kwikApiUrl.replace(kwikApiKey, '***HIDDEN***'));
        
        const response = await fetch(kwikApiUrl);
        
        console.log('📊 Response Status:', response.status);
        console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response Error Text:', errorText);
            throw new Error(`KwikAPI request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📥 Response Status Field:', data.status);
        console.log('📥 Response Keys:', Object.keys(data));
        
        if (data.status !== 'SUCCESS') {
            console.error('❌ Full KwikAPI Response:', data);
            throw new Error(`KwikAPI returned error: ${data.message || data.error || 'Unknown error'}`);
        }

        const operators = data.response;
        console.log(`📥 Fetched ${operators.length} operators from KwikAPI`);

        // Group by service type
        const serviceGroups = {};
        operators.forEach(op => {
            const serviceType = op.service_type;
            if (!serviceGroups[serviceType]) {
                serviceGroups[serviceType] = [];
            }
            serviceGroups[serviceType].push(op);
        });

        console.log('\n📊 KwikAPI Operators by Service Type:');
        Object.entries(serviceGroups).forEach(([service, ops]) => {
            const activeOps = ops.filter(op => op.status === '1' && op.biller_status === 'on');
            console.log(`  ${service}: ${ops.length} total (${activeOps.length} active)`);
        });

        // Show some sample operators
        console.log('\n📋 Sample operators:');
        operators.slice(0, 5).forEach(op => {
            console.log(`  ID: ${op.operator_id}, Name: ${op.operator_name}, Service: ${op.service_type}, Status: ${op.status}/${op.biller_status}`);
        });

        // Check for potential duplicates in KwikAPI response
        const operatorIds = operators.map(op => op.operator_id);
        const uniqueIds = new Set(operatorIds);
        
        if (operatorIds.length !== uniqueIds.size) {
            console.log(`⚠️ Warning: KwikAPI returned ${operatorIds.length - uniqueIds.size} duplicate operator IDs`);
        } else {
            console.log(`✅ No duplicates in KwikAPI response`);
        }

        return {
            total: operators.length,
            serviceGroups,
            operators: operators.slice(0, 10) // Return first 10 for testing
        };

    } catch (error) {
        console.error('❌ Error testing KwikAPI:', error.message);
        console.error('❌ Full error:', error);
        return null;
    }
}

async function compareDatabaseState() {
    try {
        console.log('\n🗄️ Current database state:');
        console.log('Total operators in database: 318');
        console.log('Active operators: 277');
        console.log('Inactive operators: 41');
        
        console.log('\nService breakdown in database:');
        const dbServices = [
            { service_type: 'ELC', total_count: 104, active_count: 83 },
            { service_type: 'Broadband', total_count: 46, active_count: 46 },
            { service_type: 'Water', total_count: 43, active_count: 43 },
            { service_type: 'Insurance', total_count: 38, active_count: 38 },
            { service_type: 'Prepaid', total_count: 30, active_count: 11 },
            { service_type: 'GAS', total_count: 29, active_count: 29 },
            { service_type: 'DTH', total_count: 11, active_count: 10 },
            { service_type: 'Postpaid', total_count: 9, active_count: 9 },
            { service_type: 'Landline', total_count: 8, active_count: 8 }
        ];
        
        dbServices.forEach(service => {
            console.log(`  ${service.service_type}: ${service.total_count} total (${service.active_count} active)`);
        });
        
    } catch (error) {
        console.error('❌ Error checking database:', error.message);
    }
}

async function runComparison() {
    await compareDatabaseState();
    console.log('\n' + '='.repeat(60) + '\n');
    
    const kwikApiData = await testKwikApiDirect();
    
    if (kwikApiData) {
        console.log('\n📈 Comparison Summary:');
        console.log(`KwikAPI has ${kwikApiData.total} operators`);
        console.log(`Database has 318 operators`);
        
        if (kwikApiData.total > 318) {
            console.log(`🆕 ${kwikApiData.total - 318} new operators available from KwikAPI`);
        } else if (kwikApiData.total < 318) {
            console.log(`⚠️ Database has ${318 - kwikApiData.total} more operators than KwikAPI`);
        } else {
            console.log(`✅ Same number of operators in both sources`);
        }
    }
}

runComparison();