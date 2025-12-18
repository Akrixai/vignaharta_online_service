import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KWIKAPI_BASE_URL = 'https://www.kwikapi.com/api/v2';
const KWIKAPI_API_KEY = process.env.KWIKAPI_API_KEY;

interface KwikApiBiller {
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
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('email', user.email)
      .single();

    if (!dbUser || dbUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    if (!KWIKAPI_API_KEY) {
      return NextResponse.json(
        { error: 'KwikAPI secret key not configured' },
        { status: 500 }
      );
    }

    // Fetch billers from KwikAPI
    const response = await fetch(
      `${KWIKAPI_BASE_URL}/billerlist.php?api_key=${KWIKAPI_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`KwikAPI request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`KwikAPI returned error: ${data.message || 'Unknown error'}`);
    }

    const billers: KwikApiBiller[] = data.response;

    // Filter billers based on requirements
    const requiredServiceTypes = ['Prepaid', 'Postpaid', 'DTH', 'ELC'];
    const filteredBillers = billers.filter(biller => {
      // Include all Prepaid and DTH
      if (biller.service_type === 'Prepaid' || biller.service_type === 'DTH') {
        return true;
      }
      
      // Include only FAP postpaid operators (Jio, Airtel, Vodafone Idea)
      if (biller.service_type === 'Postpaid') {
        return biller.operator_name.includes('FAP') && 
               (biller.operator_name.includes('Jio') || 
                biller.operator_name.includes('Airtel') || 
                biller.operator_name.includes('Vodafone Idea'));
      }
      
      // Include electricity billers
      if (biller.service_type === 'ELC') {
        return true;
      }
      
      return false;
    });

    let syncedCount = 0;
    let updatedCount = 0;

    // Sync billers to database
    for (const biller of filteredBillers) {
      const billerData = {
        operator_id: parseInt(biller.operator_id),
        operator_name: biller.operator_name,
        service_type: biller.service_type,
        status: parseInt(biller.status),
        biller_status: biller.biller_status,
        bill_fetch: biller.bill_fetch,
        support_validation: biller.supportValidation,
        bbps_enabled: biller.bbps_enabled,
        amount_minimum: parseFloat(biller.amount_minimum) || 0,
        amount_maximum: parseFloat(biller.amount_maximum) || 0,
        description: biller.description,
        message: biller.message,
        is_active: biller.status === '1' && biller.biller_status === 'on',
        updated_at: new Date().toISOString()
      };

      // Upsert biller
      const { data: existingBiller } = await supabase
        .from('kwikapi_billers')
        .select('id')
        .eq('operator_id', billerData.operator_id)
        .single();

      if (existingBiller) {
        // Update existing biller
        const { error } = await supabase
          .from('kwikapi_billers')
          .update(billerData)
          .eq('operator_id', billerData.operator_id);

        if (error) {
          console.error(`Error updating biller ${biller.operator_name}:`, error);
        } else {
          updatedCount++;
        }
      } else {
        // Insert new biller
        const { error } = await supabase
          .from('kwikapi_billers')
          .insert(billerData);

        if (error) {
          console.error(`Error inserting biller ${biller.operator_name}:`, error);
        } else {
          syncedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new billers, updated ${updatedCount} existing billers`,
      totalProcessed: filteredBillers.length,
      syncedCount,
      updatedCount
    });

  } catch (error) {
    console.error('Error syncing billers:', error);
    return NextResponse.json(
      { error: 'Failed to sync billers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}