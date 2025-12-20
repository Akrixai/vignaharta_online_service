import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('service_type');

    // Try kwikapi_billers table first, fallback to recharge_operators if empty
    let { data: kwikApiData, error: kwikApiError } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('is_active', true)
      .order('operator_name');

    let data, error;
    let useKwikApiTable = false;

    if (kwikApiError) {
      console.error('Error fetching from kwikapi_billers:', kwikApiError);
    }

    // If kwikapi_billers has data, use it
    if (kwikApiData && kwikApiData.length > 0) {
      useKwikApiTable = true;
      data = kwikApiData;
      error = kwikApiError;

      // Apply service type filter for KwikAPI table
      if (serviceType) {
        const serviceTypeMap: Record<string, string[]> = {
          'PREPAID': ['Prepaid'],
          'POSTPAID': ['Postpaid'],
          'DTH': ['DTH'],
          'ELECTRICITY': ['ELC'],
          'GAS': ['GAS'],
          'WATER': ['Water']
        };

        const mappedTypes = serviceTypeMap[serviceType.toUpperCase()] || [serviceType];
        data = data.filter((op: any) => mappedTypes.includes(op.service_type));
      }
    } else {
      // Fallback to recharge_operators table
      console.log('kwikapi_billers is empty, falling back to recharge_operators table');

      let fallbackQuery = supabase
        .from('recharge_operators')
        .select('*')
        .eq('is_active', true)
        .order('operator_name');

      if (serviceType) {
        fallbackQuery = fallbackQuery.eq('service_type', serviceType.toUpperCase());
      }

      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    // Filter operators based on service type
    let filteredOperators = data || [];

    // For PREPAID, only show mobile operators
    if (serviceType && serviceType.toUpperCase() === 'PREPAID') {
      // Valid mobile prepaid operator IDs from KWIKAPI
      const validMobileOpids = [
        1,   // Airtel
        3,   // Idea / VI
        4,   // BSNL Topup (legacy)
        5,   // BSNL Special (legacy)
        8,   // Jio
        14,  // MTNL
        15,  // MTNL Special
        21,  // Vodafone / VI
        177, // Airtel Official
        178, // VI Official
        179, // BSNL Topup Official
        180, // BSNL Special Official
        181, // Jio Official
        182, // MTNL Prepaid (actual)
        183, // MTNL Special (actual)
      ];

      filteredOperators = (data || []).filter((op: any) => {
        // For KwikAPI table, use operator_id; for legacy table, use kwikapi_opid
        const opid = useKwikApiTable ? op.operator_id : op.kwikapi_opid;
        return opid && validMobileOpids.includes(opid);
      });
    }

    // For POSTPAID, maintain active filter or specific working operators if needed,
    // but don't restrict to just FAP if others are available in the DB
    if (serviceType && serviceType.toUpperCase() === 'POSTPAID') {
      // If we have specific known working IDs, we can use them, but let's allow all active for now
      // filteredOperators = (data || []).filter((op: any) => {
      //   return [48, 36, 115, 195, 196, 29, 281, 282, 283].includes(op.operator_id || op.kwikapi_opid);
      // });
    }

    // Remove sensitive data from response and handle both table formats
    const sanitizedOperators = filteredOperators.map(op => {
      if (useKwikApiTable) {
        // KwikAPI billers table format
        return {
          id: op.id,
          operator_code: `KWIKAPI_${op.operator_id}`,
          operator_name: op.operator_name,
          service_type: serviceType || op.service_type,
          kwikapi_opid: op.operator_id, // KwikAPI operator ID
          min_amount: op.amount_minimum,
          max_amount: op.amount_maximum,
          is_active: op.is_active,
          metadata: {
            bill_fetch: op.bill_fetch,
            message: op.message,
            bbps_enabled: op.bbps_enabled,
          }
        };
      } else {
        // Legacy recharge_operators table format
        return {
          id: op.id,
          operator_code: op.operator_code,
          operator_name: op.operator_name,
          service_type: serviceType || op.service_type,
          kwikapi_opid: op.kwikapi_opid || extractOpidFromCode(op.operator_code),
          min_amount: op.min_amount || 10,
          max_amount: op.max_amount || 50000,
          is_active: op.is_active,
          logo_url: op.logo_url,
          metadata: {
            bill_fetch: op.bill_fetch_supported ? 'YES' : 'NO',
            message: op.description || '',
            bbps_enabled: 'NO',
          }
        };
      }
    });

    // Helper function to extract opid from operator code
    function extractOpidFromCode(operatorCode: string): number {
      // Map common operator codes to KwikAPI opids
      const opidMap: Record<string, number> = {
        'JIO_OFFICIAL_181': 8,
        'AIRTEL_OFFICIAL_177': 1,
        'VI_OFFICIAL_178': 3,
        'BSNL': 4,
        'MTNL': 14,
      };

      return opidMap[operatorCode] || 1; // Default to 1 if not found
    }

    return NextResponse.json({
      success: true,
      data: sanitizedOperators,
    });
  } catch (error: any) {
    console.error('Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add POST method to handle service type filtering
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceTypes } = await request.json();

    // Try kwikapi_billers table first, fallback to recharge_operators if empty
    let { data: kwikApiData, error: kwikApiError } = await supabase
      .from('kwikapi_billers')
      .select('*')
      .eq('is_active', true)
      .order('operator_name');

    let data, error;
    let useKwikApiTable = false;

    if (kwikApiError) {
      console.error('Error fetching from kwikapi_billers:', kwikApiError);
    }

    // If kwikapi_billers has data, use it
    if (kwikApiData && kwikApiData.length > 0) {
      useKwikApiTable = true;
      data = kwikApiData;
      error = kwikApiError;

      // Apply service type filter for KwikAPI table
      if (serviceTypes && serviceTypes.length > 0) {
        data = data.filter((op: any) => serviceTypes.includes(op.service_type));
      }
    } else {
      // Fallback to recharge_operators table
      console.log('kwikapi_billers is empty, falling back to recharge_operators table');

      let fallbackQuery = supabase
        .from('recharge_operators')
        .select('*')
        .eq('is_active', true)
        .order('operator_name');

      if (serviceTypes && serviceTypes.length > 0) {
        // Map service types for legacy table
        const legacyServiceTypes = serviceTypes.map((st: string) => {
          if (st === 'Prepaid') return 'PREPAID';
          if (st === 'Postpaid') return 'POSTPAID';
          if (st === 'DTH') return 'DTH';
          if (st === 'ELC') return 'ELECTRICITY';
          return st.toUpperCase();
        });
        fallbackQuery = fallbackQuery.in('service_type', legacyServiceTypes);
      }

      const fallbackResult = await fallbackQuery;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;

    let filteredOperators = data || [];

    // Apply specific filters based on service types
    if (serviceTypes?.includes('Prepaid')) {
      const validMobileOpids = [1, 3, 4, 5, 8, 14, 15, 21, 177, 178, 179, 180, 181, 182, 183];
      filteredOperators = filteredOperators.filter((op: any) => {
        // Check both KwikAPI format ('Prepaid') and legacy format ('PREPAID')
        if (op.service_type === 'Prepaid' || op.service_type === 'PREPAID') {
          // For KwikAPI table, use operator_id; for legacy table, use kwikapi_opid
          const opid = useKwikApiTable ? op.operator_id : op.kwikapi_opid;
          return opid && validMobileOpids.includes(opid);
        }
        return true;
      });
    }

    if (serviceTypes?.includes('Postpaid')) {
      // Relaxed filter for postpaid
    }

    const sanitizedOperators = filteredOperators.map(op => {
      if (useKwikApiTable) {
        // KwikAPI billers table format
        return {
          id: op.id,
          operator_code: `KWIKAPI_${op.operator_id}`,
          operator_name: op.operator_name,
          service_type: op.service_type,
          kwikapi_opid: op.operator_id,
          min_amount: op.amount_minimum,
          max_amount: op.amount_maximum,
          is_active: op.is_active,
          metadata: {
            bill_fetch: op.bill_fetch,
            message: op.message,
            bbps_enabled: op.bbps_enabled,
          }
        };
      } else {
        // Legacy recharge_operators table format
        return {
          id: op.id,
          operator_code: op.operator_code,
          operator_name: op.operator_name,
          service_type: op.service_type,
          kwikapi_opid: op.kwikapi_opid || extractOpidFromCode(op.operator_code),
          min_amount: op.min_amount || 10,
          max_amount: op.max_amount || 50000,
          is_active: op.is_active,
          logo_url: op.logo_url,
          metadata: {
            bill_fetch: op.bill_fetch_supported ? 'YES' : 'NO',
            message: op.description || '',
            bbps_enabled: 'NO',
          }
        };
      }
    });

    // Helper function to extract opid from operator code (duplicate but needed in this scope)
    function extractOpidFromCode(operatorCode: string): number {
      const opidMap: Record<string, number> = {
        'JIO_OFFICIAL_181': 8,
        'AIRTEL_OFFICIAL_177': 1,
        'VI_OFFICIAL_178': 3,
        'BSNL': 4,
        'MTNL': 14,
      };

      return opidMap[operatorCode] || 1;
    }

    return NextResponse.json({
      success: true,
      data: sanitizedOperators,
    });
  } catch (error: any) {
    console.error('Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
