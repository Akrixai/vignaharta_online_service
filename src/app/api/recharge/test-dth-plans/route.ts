import { NextRequest, NextResponse } from 'next/server';

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY!;

/**
 * Test DTH Plans API Response
 * This endpoint tests what KWIKAPI returns for DTH operators
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const testOpid = searchParams.get('opid') || '27'; // Default to Tata Sky

        console.log('🧪 Testing DTH Plans API for opid:', testOpid);

        // Test 1: DTH with no state_code (correct approach)
        const formData1 = new URLSearchParams();
        formData1.append('api_key', KWIKAPI_API_KEY);
        formData1.append('opid', testOpid);

        console.log('📡 Test 1: DTH without state_code');
        const response1 = await fetch(`${KWIKAPI_BASE_URL}/recharge_plans.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData1.toString(),
        });

        const data1 = await response1.json();
        console.log('📦 Response 1:', JSON.stringify(data1, null, 2));

        // Test 2: DTH with dummy state_code (to see if it makes a difference)
        const formData2 = new URLSearchParams();
        formData2.append('api_key', KWIKAPI_API_KEY);
        formData2.append('opid', testOpid);
        formData2.append('state_code', '1'); // Delhi

        console.log('📡 Test 2: DTH with state_code=1 (Delhi)');
        const response2 = await fetch(`${KWIKAPI_BASE_URL}/recharge_plans.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData2.toString(),
        });

        const data2 = await response2.json();
        console.log('📦 Response 2:', JSON.stringify(data2, null, 2));

        return NextResponse.json({
            success: true,
            test_results: {
                opid: testOpid,
                test1_without_state_code: {
                    success: data1.success,
                    has_plans: !!data1.plans,
                    plan_count: data1.plans ? Object.keys(data1.plans).length : 0,
                    message: data1.message,
                    full_response: data1
                },
                test2_with_state_code: {
                    success: data2.success,
                    has_plans: !!data2.plans,
                    plan_count: data2.plans ? Object.keys(data2.plans).length : 0,
                    message: data2.message,
                    full_response: data2
                },
                conclusion: data1.plans || data2.plans
                    ? 'DTH plans ARE supported by KWIKAPI'
                    : 'DTH plans are NOT supported - need alternative solution'
            }
        });

    } catch (error: any) {
        console.error('❌ Test Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            details: error.response?.data
        }, { status: 500 });
    }
}
