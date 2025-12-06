import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KWIKAPI_BASE_URL = process.env.KWIKAPI_BASE_URL || 'https://www.kwikapi.com';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', authUser.email)
      .single();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all operators from KWIKAPI
    console.log('Fetching operators from KWIKAPI with key:', KWIKAPI_API_KEY?.substring(0, 10) + '...');

    let response;
    try {
      response = await axios.get(
        `${KWIKAPI_BASE_URL}/api/v2/operator_codes.php`,
        {
          params: { api_key: KWIKAPI_API_KEY },
          timeout: 30000,
        }
      );
    } catch (axiosError: any) {
      console.error('KWIKAPI API Error:', {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        message: axiosError.message,
      });

      return NextResponse.json(
        {
          success: false,
          message: `KWIKAPI API Error: ${axiosError.response?.data || axiosError.message}`,
          details: {
            status: axiosError.response?.status,
            data: axiosError.response?.data,
          }
        },
        { status: 500 }
      );
    }

    console.log('KWIKAPI Response:', response.data);

    if (!response.data || !response.data.response) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid response from KWIKAPI',
          response: response.data
        },
        { status: 500 }
      );
    }

    const operators = response.data.response;
    let syncedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // Map service types
    const serviceTypeMap: { [key: string]: string } = {
      'Prepaid': 'PREPAID',
      'Postpaid': 'POSTPAID',
      'DTH': 'DTH',
      'ELC': 'ELECTRICITY',
      'DATACARD': 'PREPAID', // Map datacard to prepaid
    };

    for (const op of operators) {
      try {
        const serviceType = serviceTypeMap[op.service_type] || 'PREPAID';

        // Skip if service type not supported
        if (!['PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY'].includes(serviceType)) {
          skippedCount++;
          continue;
        }

        // Check if operator exists
        const { data: existing } = await supabase
          .from('recharge_operators')
          .select('id')
          .eq('kwikapi_opid', parseInt(op.operator_id))
          .single();

        const operatorData = {
          operator_name: op.operator_name,
          service_type: serviceType,
          kwikapi_opid: parseInt(op.operator_id),
          is_active: op.status === '1',
          min_amount: parseFloat(op.amount_minimum) || 10,
          max_amount: parseFloat(op.amount_maximum) || 50000,
          commission_rate: serviceType === 'PREPAID' ? 2.5 : serviceType === 'DTH' ? 2.0 : 1.0,
          metadata: {
            bill_fetch: op.bill_fetch,
            bbps_enabled: op.bbps_enabled,
            message: op.message,
            description: op.description,
          },
        };

        if (existing) {
          // Update existing
          await supabase
            .from('recharge_operators')
            .update(operatorData)
            .eq('id', existing.id);
          updatedCount++;
        } else {
          // Insert new - generate operator_code from name and opid
          const operatorCode = `${op.operator_name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 40)}_${op.operator_id}`;

          await supabase.from('recharge_operators').insert({
            ...operatorData,
            operator_code: operatorCode,
          });
          syncedCount++;
        }
      } catch (error: any) {
        console.error(`Error syncing operator ${op.operator_id}:`, error.message);
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new operators, updated ${updatedCount} existing operators, skipped ${skippedCount}`,
      data: {
        total: operators.length,
        synced: syncedCount,
        updated: updatedCount,
        skipped: skippedCount,
      },
    });
  } catch (error: any) {
    console.error('Sync All Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
