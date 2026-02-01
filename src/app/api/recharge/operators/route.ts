import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');

    if (!serviceType) {
      return NextResponse.json(
        { success: false, message: 'service_type parameter is required' },
        { status: 400 }
      );
    }

    // Map service types for consistency - handle all variations
    const serviceTypeMapping: { [key: string]: string[] } = {
      'ELECTRICITY': ['ELC'],
      'POSTPAID': ['Postpaid'],
      'PREPAID': ['Prepaid'],
      'DTH': ['DTH'],
      'GAS': ['GAS', 'Gas', 'GAS_Cylinder'], // Handle all gas-related service types
      'WATER': ['Water'],
      'BROADBAND': ['Broadband'],
      'LANDLINE': ['Landline'],
      'DATACARD': ['DataCard', 'DATACARD'],
      'CABLETV': ['CableTV', 'Cable TV'],
      'FASTAG': ['FASTag'],
      'INSURANCE': ['Insurance'],
      'CREDITCARD': ['CreditCard'],
      'MONEYTRANSFER': ['MoneyTransfer'],
      'PAN': ['PAN'],
      'PAYMENTS': ['PAYMENTS']
    };

    const mappedServiceTypes = serviceTypeMapping[serviceType.toUpperCase()] || [serviceType];

    // Fetch operators from kwikapi_billers table - handle multiple service types
    const { data: operators, error } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .in('service_type', mappedServiceTypes)
      .eq('is_active', true)
      .order('operator_name');

    if (error) {
      console.error('Error fetching operators:', error);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch operators' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const transformedOperators = operators.map(op => ({
      id: op.id,
      operator_code: `KWIKAPI_${op.operator_id}`,
      operator_name: op.operator_name,
      service_type: serviceType.toUpperCase(), // Return the requested service type
      logo_url: null,
      min_amount: parseFloat(op.amount_minimum || '1'),
      max_amount: parseFloat(op.amount_maximum || '50000'),
      metadata: {
        bill_fetch: op.bill_fetch || 'NO',
        bbps_enabled: op.bbps_enabled || 'NO',
        description: op.description || '',
        message: op.message || ''
      },
      kwikapi_opid: op.operator_id
    }));

    return NextResponse.json({
      success: true,
      data: transformedOperators,
      count: transformedOperators.length
    });

  } catch (error: any) {
    console.error('Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}