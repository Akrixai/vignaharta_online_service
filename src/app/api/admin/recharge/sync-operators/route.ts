import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import kwikapi from '@/lib/kwikapi';
import { getServerSession } from 'next-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { operator_ids } = body; // Array of KWIKAPI opid values to sync

    if (!operator_ids || !Array.isArray(operator_ids)) {
      return NextResponse.json(
        { success: false, message: 'Missing required field: operator_ids (array)' },
        { status: 400 }
      );
    }

    let syncedCount = 0;
    let updatedCount = 0;
    const errors: any[] = [];

    // Sync each operator
    for (const opid of operator_ids) {
      try {
        const operatorDetails = await kwikapi.getOperatorDetails(opid);

        if (!operatorDetails.success) {
          errors.push({ opid, error: 'Failed to fetch operator details' });
          continue;
        }

        const data = operatorDetails.data;
        
        // Map KWIKAPI service_type to our enum
        let serviceType = data.service_type;
        if (!['PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY', 'GAS', 'WATER'].includes(serviceType)) {
          // Map common variations
          if (serviceType === 'PRE') serviceType = 'PREPAID';
          else if (serviceType === 'PST') serviceType = 'POSTPAID';
          else if (serviceType === 'ELC') serviceType = 'ELECTRICITY';
          else {
            errors.push({ opid, error: `Unknown service type: ${serviceType}` });
            continue;
          }
        }

        // Check if operator exists
        const { data: existing } = await supabase
          .from('recharge_operators')
          .select('id')
          .eq('kwikapi_opid', opid)
          .single();

        const operatorData = {
          operator_name: data.operator_name,
          service_type: serviceType,
          kwikapi_opid: opid,
          is_active: data.status === '1',
          min_amount: parseFloat(data.amount_minimum) || 10,
          max_amount: parseFloat(data.amount_maximum) || 50000,
          metadata: {
            bill_fetch: data.bill_fetch,
            bbps_enabled: data.bbps_enabled,
            message: data.message,
            description: data.description,
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
          // Insert new - generate operator_code from name
          const operatorCode = data.operator_name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 50);

          await supabase.from('recharge_operators').insert({
            ...operatorData,
            operator_code: `${operatorCode}_${opid}`,
          });
          syncedCount++;
        }
      } catch (error: any) {
        errors.push({ opid, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new operators, updated ${updatedCount} existing operators`,
      data: {
        total: operator_ids.length,
        synced: syncedCount,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('Sync Operators API Error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
