import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface KwikApiOperator {
  operator_name: string;
  operator_id: string;
  service_type: string;
  status: string;
  biller_status: string;
  bill_fetch: string;
  supportValidation: string;
  bbps_enabled: string;
  message: string;
  description: string;
  amount_minimum: string;
  amount_maximum: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Starting operator sync from KwikAPI...');

    // Verify API key is available
    if (!process.env.KWIKAPI_API_KEY) {
      throw new Error('KWIKAPI_API_KEY environment variable is not set');
    }

    // Fetch operators from KwikAPI
    const kwikApiUrl = `https://www.kwikapi.com/api/v2/operator_codes.php?api_key=${process.env.KWIKAPI_API_KEY}`;
    console.log('📡 Calling KwikAPI URL:', kwikApiUrl.replace(process.env.KWIKAPI_API_KEY, '***HIDDEN***'));
    
    const response = await fetch(kwikApiUrl);
    if (!response.ok) {
      throw new Error(`KwikAPI request failed: ${response.status} ${response.statusText}`);
    }

    const kwikApiData = await response.json();
    console.log('📥 KwikAPI Response Status:', kwikApiData.status);
    
    if (kwikApiData.status !== 'SUCCESS') {
      console.error('❌ KwikAPI Error Details:', kwikApiData);
      throw new Error(`KwikAPI returned error: ${kwikApiData.message || kwikApiData.error || 'Unknown error'}`);
    }

    const operators: KwikApiOperator[] = kwikApiData.response;
    console.log(`📥 Fetched ${operators.length} operators from KwikAPI`);

    // Service type mapping for consistency
    const serviceTypeMapping: Record<string, string> = {
      'Prepaid': 'Prepaid',
      'Postpaid': 'Postpaid',
      'DTH': 'DTH',
      'ELC': 'ELC',
      'GAS': 'GAS',
      'Water': 'Water',
      'Insurance': 'Insurance',
      'Broadband': 'Broadband',
      'Landline': 'Landline',
      'DATACARD': 'DataCard',
      'Fastag': 'FASTag',
      'Cable TV': 'CableTV',
      'Credit Card': 'CreditCard',
      'Money Transfer': 'MoneyTransfer',
      'PAN': 'PAN'
    };

    let insertedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    // First, get existing operator IDs to properly track inserts vs updates
    const { data: existingOperators } = await supabase
      .from('kwikapi_billers')
      .select('operator_id');
    
    const existingOperatorIds = new Set(existingOperators?.map(op => op.operator_id) || []);
    console.log(`📊 Found ${existingOperatorIds.size} existing operators in database`);

    // Process operators in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < operators.length; i += batchSize) {
      const batch = operators.slice(i, i + batchSize);
      
      for (const operator of batch) {
        try {
          // Skip operators with invalid data
          if (!operator.operator_id || !operator.operator_name || !operator.service_type) {
            console.log(`⚠️ Skipping operator with missing data:`, operator);
            skippedCount++;
            continue;
          }

          const operatorId = parseInt(operator.operator_id);
          const isExisting = existingOperatorIds.has(operatorId);

          // Map service type
          const mappedServiceType = serviceTypeMapping[operator.service_type] || operator.service_type;

          // Parse amounts with fallbacks and database limits
          const minAmount = Math.max(1, parseInt(operator.amount_minimum) || 1);
          const maxAmount = Math.min(99999999.99, parseInt(operator.amount_maximum) || 50000);

          // Log if we had to cap the maximum amount
          if (parseInt(operator.amount_maximum) > 99999999) {
            console.log(`⚠️ Capped max amount for operator ${operator.operator_id} from ${operator.amount_maximum} to 99999999.99`);
          }

          // Determine if operator should be active (status = 1 and biller_status = on)
          const isActive = operator.status === '1' && operator.biller_status === 'on';

          const operatorData = {
            operator_id: operatorId,
            operator_name: operator.operator_name.trim(),
            service_type: mappedServiceType,
            status: operator.status,
            biller_status: operator.biller_status,
            bill_fetch: operator.bill_fetch || 'NO',
            support_validation: operator.supportValidation || 'NOT_SUPPORTED',
            bbps_enabled: operator.bbps_enabled || 'NO',
            message: operator.message || 'NA',
            description: operator.description || '',
            amount_minimum: minAmount,
            amount_maximum: maxAmount,
            is_active: isActive,
            updated_at: new Date().toISOString()
          };

          if (isExisting) {
            // Update existing operator
            const { error } = await supabase
              .from('kwikapi_billers')
              .update(operatorData)
              .eq('operator_id', operatorId);

            if (error) {
              console.error(`❌ Error updating operator ${operatorId}:`, error);
              skippedCount++;
            } else {
              updatedCount++;
              console.log(`🔄 Updated operator ${operatorId}: ${operator.operator_name}`);
            }
          } else {
            // Insert new operator
            const { error } = await supabase
              .from('kwikapi_billers')
              .insert(operatorData);

            if (error) {
              console.error(`❌ Error inserting operator ${operatorId}:`, error);
              skippedCount++;
            } else {
              insertedCount++;
              existingOperatorIds.add(operatorId); // Add to set to avoid duplicate processing
              console.log(`➕ Inserted new operator ${operatorId}: ${operator.operator_name}`);
            }
          }

        } catch (operatorError) {
          console.error(`❌ Error processing operator ${operator.operator_id}:`, operatorError);
          skippedCount++;
        }
      }

      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < operators.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`⏳ Processed batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(operators.length/batchSize)}`);
      }
    }

    // Get final statistics
    const { data: finalStats } = await supabase
      .from('kwikapi_billers')
      .select('service_type, is_active')
      .eq('is_active', true);

    const serviceStats = finalStats?.reduce((acc: Record<string, number>, op) => {
      acc[op.service_type] = (acc[op.service_type] || 0) + 1;
      return acc;
    }, {}) || {};

    const totalActive = Object.values(serviceStats).reduce((sum: number, count: number) => sum + count, 0);

    console.log('✅ Operator sync completed');
    console.log(`📊 Statistics: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`);
    console.log(`📈 Active operators by service:`, serviceStats);

    return NextResponse.json({
      success: true,
      message: `Operator sync completed successfully! ${insertedCount} new operators added, ${updatedCount} updated, ${skippedCount} skipped.`,
      statistics: {
        total_processed: operators.length,
        inserted: insertedCount,
        updated: updatedCount,
        skipped: skippedCount,
        total_active: totalActive,
        service_breakdown: serviceStats
      }
    });

  } catch (error: any) {
    console.error('❌ Operator sync failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `Operator sync failed: ${error.message}`,
        details: error.stack
      },
      { status: 500 }
    );
  }
}