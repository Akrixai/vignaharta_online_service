/**
 * Comprehensive Bill Fetch Testing Script
 * Tests both postpaid mobile and electricity bill fetching with KWIKAPI
 */

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY || '4d3105-f2aaf2-1f5bcf-f40193'; // Replace with your actual API key

// Test cases for different operators
const testCases = [
  // Postpaid Mobile Tests
  {
    name: 'BSNL Postpaid Mobile',
    opid: 36,
    service_type: 'POSTPAID',
    test_numbers: ['9999999999', '8888888888'], // Use test numbers
    expected_bill_fetch: 'YES',
    notes: 'BSNL Postpaid supports bill fetch'
  },
  {
    name: 'Airtel Postpaid Mobile',
    opid: 48,
    service_type: 'POSTPAID',
    test_numbers: ['9999999999', '8888888888'],
    expected_bill_fetch: 'NO', // Check documentation
    notes: 'Airtel Postpaid - check if bill fetch is supported'
  },
  
  // Electricity Tests
  {
    name: 'BSES Yamuna Power Limited - Delhi',
    opid: 50,
    service_type: 'ELECTRICITY',
    test_numbers: ['1234567890', '0987654321'], // CA Numbers
    expected_bill_fetch: 'YES',
    notes: 'Pass CA Number in account field'
  },
  {
    name: 'BSES Rajdhani Power Limited - Delhi',
    opid: 51,
    service_type: 'ELECTRICITY',
    test_numbers: ['1234567890', '0987654321'], // CA Numbers
    expected_bill_fetch: 'YES',
    notes: 'Pass CA Number in account field'
  },
  {
    name: 'West Bengal State Electricity Distribution Nigam - WBSEDCL',
    opid: 55,
    service_type: 'ELECTRICITY',
    test_numbers: ['123456789012', '987654321098'], // Consumer IDs
    expected_bill_fetch: 'YES',
    notes: 'Pass Consumer ID in account field'
  },
  {
    name: 'Tata Power Delhi Distribution Limited - Delhi',
    opid: 56,
    service_type: 'ELECTRICITY',
    test_numbers: ['1234567890', '0987654321'], // CA Numbers
    expected_bill_fetch: 'YES',
    notes: 'Pass CA Number in account field'
  },
  {
    name: 'North Bihar power distribution company ltd - NBPDCL',
    opid: 63,
    service_type: 'ELECTRICITY',
    test_numbers: ['12438555985', '98765432101'], // CA Numbers from documentation
    expected_bill_fetch: 'YES',
    notes: 'Pass CA Number in account field'
  },
  {
    name: 'MSEDC MAHARASHTRA',
    opid: 76,
    service_type: 'ELECTRICITY',
    test_numbers: ['123456789012', '987654321098'], // Consumer Numbers with billing unit
    expected_bill_fetch: 'YES',
    notes: 'Pass Consumer Number in account and Billing Unit in optional1',
    special_params: {
      opt1: '12' // Billing unit (last 2 digits of consumer number)
    }
  }
];

async function testOperatorDetails(opid) {
  console.log(`\n🔍 Testing Operator Details for OPID: ${opid}`);
  
  try {
    const formData = new URLSearchParams();
    formData.append('api_key', KWIKAPI_API_KEY);
    formData.append('opid', opid.toString());

    const response = await fetch(`${KWIKAPI_BASE_URL}/api/v2/operatorFetch.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await response.json();
    
    console.log('📋 Operator Details Response:', {
      success: data.success,
      operator_name: data.operator_name,
      service_type: data.service_type,
      bill_fetch: data.bill_fetch,
      bbps_enabled: data.bbps_enabled,
      message: data.message,
      amount_range: `${data.amount_minimum} - ${data.amount_maximum}`
    });

    return data;
  } catch (error) {
    console.error('❌ Error fetching operator details:', error.message);
    return null;
  }
}

async function testBillFetch(opid, accountNumber, mobileNumber = '9999999999', additionalParams = {}) {
  console.log(`\n💳 Testing Bill Fetch for OPID: ${opid}, Account: ${accountNumber}`);
  
  try {
    const params = new URLSearchParams({
      api_key: KWIKAPI_API_KEY,
      number: accountNumber,
      amount: '10',
      opid: opid.toString(),
      order_id: `TEST_${Date.now()}`,
      opt8: 'Bills', // Required literal
      mobile: mobileNumber
    });

    // Add additional parameters for specific operators
    if (additionalParams.opt1) {
      params.append('opt1', additionalParams.opt1);
      console.log('📋 Adding opt1 parameter:', additionalParams.opt1);
    }
    if (additionalParams.opt2) {
      params.append('opt2', additionalParams.opt2);
      console.log('📋 Adding opt2 parameter:', additionalParams.opt2);
    }

    const url = `${KWIKAPI_BASE_URL}/api/v2/bills/validation.php?${params.toString()}`;
    console.log('📡 Bill Fetch URL:', url.replace(KWIKAPI_API_KEY, '***'));

    const response = await fetch(url, {
      method: 'GET',
      timeout: 30000
    });

    const data = await response.json();
    
    console.log('📦 Bill Fetch Response:', {
      status: data.status,
      message: data.message,
      customer_name: data.customer_name || data.customername,
      due_amount: data.due_amount || data.dueamount,
      bill_number: data.bill_number || data.billnumber,
      due_date: data.due_date || data.duedate,
      ref_id: data.ref_id || data.refid
    });

    return data;
  } catch (error) {
    console.error('❌ Error in bill fetch:', error.message);
    return { status: 'ERROR', message: error.message };
  }
}

async function testUtilityPayment(opid, accountNumber, amount, refId, mobileNumber = '9999999999') {
  console.log(`\n💰 Testing Utility Payment for OPID: ${opid}, Account: ${accountNumber}, Amount: ${amount}`);
  
  try {
    const params = new URLSearchParams({
      api_key: KWIKAPI_API_KEY,
      number: accountNumber,
      amount: amount.toString(),
      opid: opid.toString(),
      order_id: `PAY_TEST_${Date.now()}`,
      opt8: 'Bills',
      mobile: mobileNumber
    });

    // Add ref_id if provided (critical for BBPS payments)
    if (refId) {
      params.append('refrence_id', refId); // Note: KWIKAPI uses "refrence_id" (typo in their API)
    }

    const url = `${KWIKAPI_BASE_URL}/api/v2/bills/payments.php?${params.toString()}`;
    console.log('📡 Payment URL:', url.replace(KWIKAPI_API_KEY, '***'));

    const response = await fetch(url, {
      method: 'GET',
      timeout: 45000
    });

    const data = await response.json();
    
    console.log('📦 Payment Response:', {
      status: data.status,
      message: data.message,
      order_id: data.order_id,
      operator_ref: data.opr_id || data.operator_ref,
      charged_amount: data.charged_amount,
      balance: data.balance
    });

    return data;
  } catch (error) {
    console.error('❌ Error in utility payment:', error.message);
    return { status: 'ERROR', message: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive Bill Fetch Tests');
  console.log('=' .repeat(60));

  for (const testCase of testCases) {
    console.log(`\n📋 Testing: ${testCase.name}`);
    console.log('─'.repeat(40));

    // Step 1: Get operator details
    const operatorDetails = await testOperatorDetails(testCase.opid);
    
    if (!operatorDetails || !operatorDetails.success) {
      console.log('❌ Failed to get operator details, skipping...');
      continue;
    }

    // Step 2: Verify bill fetch support
    if (operatorDetails.bill_fetch !== 'YES') {
      console.log(`⚠️ Bill fetch not supported (${operatorDetails.bill_fetch}), skipping bill fetch test...`);
      continue;
    }

    // Step 3: Test bill fetch with test numbers
    for (const testNumber of testCase.test_numbers) {
      const billResult = await testBillFetch(testCase.opid, testNumber);
      
      if (billResult.status === 'SUCCESS') {
        console.log('✅ Bill fetch successful!');
        
        // Step 4: Test payment with fetched bill details (small amount)
        const paymentAmount = Math.min(parseFloat(billResult.due_amount || '10'), 10); // Max ₹10 for testing
        const refId = billResult.ref_id || billResult.refid;
        
        if (refId) {
          console.log(`💳 Testing payment with ref_id: ${refId}`);
          await testUtilityPayment(testCase.opid, testNumber, paymentAmount, refId);
        } else {
          console.log('⚠️ No ref_id in bill fetch response, skipping payment test');
        }
        
        break; // Success with this number, move to next operator
      } else {
        console.log(`❌ Bill fetch failed: ${billResult.message}`);
      }
    }

    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🏁 Comprehensive tests completed!');
}

// Run the tests
if (require.main === module) {
  runComprehensiveTests().catch(console.error);
}

module.exports = {
  testOperatorDetails,
  testBillFetch,
  testUtilityPayment,
  runComprehensiveTests
};