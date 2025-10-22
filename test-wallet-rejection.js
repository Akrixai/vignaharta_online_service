// Test script to check wallet rejection API
const testWalletRejection = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/admin/wallet-requests', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request_id: '328e8a7b-452a-4557-8a4e-66c1a70b9ec1',
        action: 'REJECT',
        rejection_reason: null
      }),
    });

    const result = await response.json();
    console.log('Response:', result);
  } catch (error) {
    console.error('Error:', error);
  }
};

testWalletRejection();