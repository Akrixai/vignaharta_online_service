// KWIKAPI Real-Time Operator Detection
// Add this to src/lib/kwikapi.ts to replace the detectOperator function

/**
 * Detect Operator from Mobile Number using KWIKAPI's Real-Time API
 * Uses operator_fetch_v2.php which supports MNP and circle changes
 * This is the REAL-TIME detection from KWIKAPI!
 */
async detectOperator(mobile_number: string): Promise < KwikAPIResponse > {
    try {
        console.log('🔍 Detecting operator for:', mobile_number, 'using KWIKAPI Real-Time API');

        // Call KWIKAPI's operator_fetch_v2.php API
        const formData = new URLSearchParams();
        formData.append('api_key', KWIKAPI_API_KEY);
        formData.append('number', mobile_number);

        console.log('📡 Calling KWIKAPI operator_fetch_v2.php...');

        const response = await this.client.post('/api/v2/operator_fetch_v2.php', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        console.log('📦 KWIKAPI Detection Response:', response.data);

        if(response.data.success && response.data.details) {
    const details = response.data.details;
    const operatorName = details.operator || details.Operator || '';
    const circleName = details.Circle || details.circle || '';

    // Map KWIKAPI operator names to our operator codes
    const operatorMapping: Record<string, { code: string; name: string; opid: number }> = {
        'JIO': { code: 'JIO', name: 'Reliance Jio', opid: 8 },
        'AIRTEL': { code: 'AIRTEL', name: 'Airtel', opid: 1 },
        'IDEA': { code: 'VI', name: 'Vodafone Idea', opid: 3 },
        'VODAFONE': { code: 'VI', name: 'Vodafone Idea', opid: 3 },
        'VI': { code: 'VI', name: 'Vodafone Idea', opid: 3 },
        'BSNL': { code: 'BSNL', name: 'BSNL', opid: 4 },
        'MTNL': { code: 'MTNL', name: 'MTNL', opid: 14 },
    };

    // Map circle names to circle codes
    const circleMapping: Record<string, string> = {
        'Maharashtra': '4',
        'Maharashtra and Goa': '4',
        'Delhi': '1',
        'Delhi NCR': '1',
        'Mumbai': '2',
        'Kolkata': '3',
        'Tamil Nadu': '5',
        'Karnataka': '6',
        'Andhra Pradesh': '7',
        'Kerala': '8',
        'Punjab': '9',
        'Haryana': '10',
        'Uttar Pradesh (East)': '11',
        'Uttar Pradesh (West)': '12',
        'Rajasthan': '13',
        'Gujarat': '14',
        'Madhya Pradesh': '15',
        'West Bengal': '16',
        'Bihar': '17',
        'Bihar and Jharkhand': '17',
        'Orissa': '18',
        'Assam': '19',
        'North East': '20',
        'Himachal Pradesh': '21',
        'Jammu and Kashmir': '22',
        'Chennai': '23',
    };

    const operatorUpper = operatorName.toUpperCase();
    const operatorInfo = operatorMapping[operatorUpper] || {
        code: operatorUpper,
        name: operatorName,
        opid: 1 // Default to Airtel opid
    };

    // Find circle code
    let circleCode = '4'; // Default to Maharashtra
    for (const [circleName_key, code] of Object.entries(circleMapping)) {
        if (circleName.toLowerCase().includes(circleName_key.toLowerCase())) {
            circleCode = code;
            break;
        }
    }

    console.log('✅ Real-time operator detected:', {
        mobile_number,
        operator: operatorInfo.name,
        operatorCode: operatorInfo.code,
        kwikapi_opid: operatorInfo.opid,
        circle: circleName,
        circleCode,
        source: 'KWIKAPI Real-Time API'
    });

    return {
        success: true,
        data: {
            mobile_number,
            operator_code: operatorInfo.code,
            operator_name: operatorInfo.name,
            kwikapi_opid: operatorInfo.opid,
            circle_code: circleCode,
            circle_name: circleName,
            operator_type: 'PREPAID',
            confidence: 'high', // Real-time API = high confidence
            detection_method: 'kwikapi_realtime',
            api_response: response.data,
        },
    };
}

console.warn('⚠️ KWIKAPI returned success:false or no details', response.data);

// Fallback to error
return {
    success: false,
    data: null,
    message: response.data.message || 'Operator detection failed',
};
    
  } catch (error: any) {
    console.error('❌ KWIKAPI Operator Detection Error:', error.response?.data || error.message);

    return {
        success: false,
        data: null,
        message: error.message || 'Operator detection failed',
    };
}
}
