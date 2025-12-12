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

        // Check if operator exists - use proper error handling
        const { data: existing, error: existingError } = await supabase
          .from('recharge_operators')
          .select('id, operator_name, metadata')
          .eq('kwikapi_opid', parseInt(op.operator_id))
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no record found

        // Handle query errors
        if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error(`Error checking existing operator ${op.operator_id}:`, existingError);
          skippedCount++;
          continue;
        }

        // Get detailed operator information for proper message field
        let detailedMessage = op.message || '';
        let detailedDescription = op.description || '';
        
        // For operators with bill fetch support, get detailed info
        if (op.bill_fetch === 'YES') {
          try {
            const detailResponse = await axios.post(
              `${KWIKAPI_BASE_URL}/api/v2/operatorFetch.php`,
              new URLSearchParams({
                api_key: KWIKAPI_API_KEY,
                opid: op.operator_id.toString(),
              }),
              {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 10000,
              }
            );

            if (detailResponse.data?.success && detailResponse.data.message) {
              detailedMessage = detailResponse.data.message;
              detailedDescription = detailResponse.data.description || detailedDescription;
            }
          } catch (detailError) {
            console.warn(`Could not fetch detailed info for operator ${op.operator_id}:`, detailError);
          }
        }

        const operatorData = {
          operator_name: op.operator_name,
          service_type: serviceType,
          kwikapi_opid: parseInt(op.operator_id),
          is_active: op.status === '1',
          min_amount: parseFloat(op.amount_minimum) || 10,
          max_amount: parseFloat(op.amount_maximum) || 50000,
          commission_rate: serviceType === 'PREPAID' ? 2.5 : serviceType === 'DTH' ? 2.0 : 1.0,
          metadata: {
            bill_fetch: op.bill_fetch || 'NO',
            bbps_enabled: op.bbps_enabled || 'NO',
            message: detailedMessage,
            description: detailedDescription,
            original_service_type: op.service_type,
            last_synced: new Date().toISOString(),
          },
        };

        // Log operators with bill fetch support for debugging
        if (op.bill_fetch === 'YES') {
          console.log(`💡 [Bill Fetch] ${op.operator_name} (${serviceType}) - Message: "${detailedMessage}"`);
        }

        if (existing) {
          // Check if update is needed (compare metadata to avoid unnecessary updates)
          const needsUpdate = 
            existing.operator_name !== op.operator_name ||
            JSON.stringify(existing.metadata) !== JSON.stringify(operatorData.metadata) ||
            existing.is_active !== operatorData.is_active;

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('recharge_operators')
              .update(operatorData)
              .eq('id', existing.id);

            if (updateError) {
              console.error(`Error updating operator ${op.operator_id}:`, updateError);
              skippedCount++;
            } else {
              updatedCount++;
            }
          } else {
            // No update needed, but count as processed
            skippedCount++;
          }
        } else {
          // Insert new - generate operator_code from name and opid
          const operatorCode = `${op.operator_name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 40)}_${op.operator_id}`;

          const { error: insertError } = await supabase.from('recharge_operators').insert({
            ...operatorData,
            operator_code: operatorCode,
          });

          if (insertError) {
            console.error(`Error inserting operator ${op.operator_id}:`, insertError);
            skippedCount++;
          } else {
            syncedCount++;
          }
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
