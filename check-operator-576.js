async function checkOperator576() {
  try {
    const kwikApiKey = '7f4a43-7c2711-25d253-4750d7-8bc5be';
    const kwikApiUrl = `https://www.kwikapi.com/api/v2/operator_codes.php?api_key=${kwikApiKey}`;
    
    console.log('Fetching operator 576 data from KwikAPI...');
    const response = await fetch(kwikApiUrl);
    const data = await response.json();
    
    if (data.status === 'SUCCESS') {
      const operator576 = data.response.find(op => op.operator_id === '576');
      if (operator576) {
        console.log('Operator 576 data from KwikAPI:');
        console.log(JSON.stringify(operator576, null, 2));
        
        // Check for problematic values
        console.log('\nAnalyzing values:');
        console.log('amount_minimum:', operator576.amount_minimum, 'Type:', typeof operator576.amount_minimum);
        console.log('amount_maximum:', operator576.amount_maximum, 'Type:', typeof operator576.amount_maximum);
        
        // Parse and validate amounts
        const minAmount = parseInt(operator576.amount_minimum) || 1;
        const maxAmount = parseInt(operator576.amount_maximum) || 50000;
        
        console.log('Parsed amounts:');
        console.log('minAmount:', minAmount);
        console.log('maxAmount:', maxAmount);
        
        if (maxAmount > 99999999) {
          console.log('⚠️ Maximum amount exceeds database limit (99,999,999)');
        }
        
      } else {
        console.log('Operator 576 not found in KwikAPI response');
      }
    } else {
      console.log('KwikAPI error:', data.message);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkOperator576();