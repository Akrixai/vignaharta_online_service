const axios = require('axios');

// Test MSEDC Maharashtra bill payment directly with KwikAPI
async function testMSEDCBillPayment() {
  const KWIKAPI_BASE_URL = 'https://www.kwikapi.com';
  const KWIKAPI_API_KEY = '7f4a43-7c2711-25d253-4750d7-8bc5be'; // From .env file

  if (!KWIKAPI_API_KEY) {
    console.error('❌ KWIKAPI_API_KEY not found in environment variables');
    return;
  }

  console.log('🔧 Testing MSEDC Maharashtra Bill Payment');
  console.log('🔑 API Key:', KWIKAPI_API_KEY.substring(0, 10) + '...');

  // Step 1: Test bill fetch first
  console.log('\n📋 Step 1: Testing Bill Fetch...');
  
  const billFetchParams = {
    api_key: KWIKAPI_API_KEY,
    number: '281540047323',
    amount: '10',
    opid: '76',
    order_id: Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000),
    opt1: '281540047323',
    opt2: '',
    opt3: '',
    opt4: '',
    opt5: '',
    opt6: '',
    opt7: '',
    opt8: 'Bills',
    opt9: '',
    opt10: '',
    mobile: '9960360750'
  };

  try {
    const billFetchUrl = `${KWIKAPI_BASE_URL}/api/v2/bills/validation.php`;
    console.log('📡 Bill Fetch URL:', billFetchUrl);
    console.log('📋 Bill Fetch Params:', { ...billFetchParams, api_key: '***' });

    const billResponse = await axios.get(billFetchUrl, { params: billFetchParams });
    console.log('📦 Bill Fetch Response:', JSON.stringify(billResponse.data, null, 2));

    if (billResponse.data.status === 'SUCCESS') {
      const refId = billResponse.data.ref_id;
      console.log('✅ Bill fetch successful, ref_id:', refId);

      // Step 2: Test bill payment
      console.log('\n💳 Step 2: Testing Bill Payment...');
      
      const paymentParams = {
        api_key: KWIKAPI_API_KEY,
        number: '281540047323',
        amount: '450.00',
        opid: '76',
        order_id: Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000),
        opt8: 'Bills',
        mobile: '9960360750',
        refrence_id: refId,
        ref_id: refId, // Send both variants
        opt1: '281540047323'
      };

      const paymentUrl = `${KWIKAPI_BASE_URL}/api/v2/bills/payments.php`;
      console.log('📡 Payment URL:', paymentUrl);
      console.log('💳 Payment Params:', { ...paymentParams, api_key: '***' });

      const paymentResponse = await axios.get(paymentUrl, { params: paymentParams });
      console.log('📦 Payment Response:', JSON.stringify(paymentResponse.data, null, 2));

      // Analyze the response
      if (paymentResponse.data.status === 'SUCCESS') {
        console.log('✅ Payment successful!');
      } else {
        console.log('❌ Payment failed');
        console.log('🔍 Failure Analysis:');
        console.log('  - Status:', paymentResponse.data.status);
        console.log('  - Message:', paymentResponse.data.message || 'No message');
        console.log('  - Operator Message:', paymentResponse.data.operator_message || 'No operator message');
        console.log('  - Order ID:', paymentResponse.data.order_id);
        console.log('  - Balance:', paymentResponse.data.balance);
        console.log('  - Charged Amount:', paymentResponse.data.charged_amount);
      }

      // Test with different parameter combinations
      console.log('\n🔬 Step 3: Testing Alternative Parameter Combinations...');
      
      // Test 1: Without opt1
      console.log('\n🧪 Test 1: Without opt1 parameter');
      const test1Params = { ...paymentParams };
      delete test1Params.opt1;
      
      try {
        const test1Response = await axios.get(paymentUrl, { params: test1Params });
        console.log('📦 Test 1 Response:', JSON.stringify(test1Response.data, null, 2));
      } catch (error) {
        console.log('❌ Test 1 Error:', error.message);
      }

      // Test 2: With different amount format
      console.log('\n🧪 Test 2: With integer amount');
      const test2Params = { ...paymentParams, amount: '450' };
      
      try {
        const test2Response = await axios.get(paymentUrl, { params: test2Params });
        console.log('📦 Test 2 Response:', JSON.stringify(test2Response.data, null, 2));
      } catch (error) {
        console.log('❌ Test 2 Error:', error.message);
      }

      // Test 3: With minimal parameters
      console.log('\n🧪 Test 3: With minimal parameters only');
      const test3Params = {
        api_key: KWIKAPI_API_KEY,
        number: '281540047323',
        amount: '450.00',
        opid: '76',
        order_id: Date.now().toString().slice(-10) + Math.floor(Math.random() * 1000),
        mobile: '9960360750',
        refrence_id: refId
      };
      
      try {
        const test3Response = await axios.get(paymentUrl, { params: test3Params });
        console.log('📦 Test 3 Response:', JSON.stringify(test3Response.data, null, 2));
      } catch (error) {
        console.log('❌ Test 3 Error:', error.message);
      }

    } else {
      console.log('❌ Bill fetch failed:', billResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('📦 Error Response:', error.response.data);
    }
  }
}

// Run the test
testMSEDCBillPayment().catch(console.error);