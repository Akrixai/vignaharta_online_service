import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-helper';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Bulk update service commission configurations
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { configs } = body;

    if (!Array.isArray(configs) || configs.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Configurations array is required' },
        { status: 400 }
      );
    }

    // Validate all configurations
    for (const config of configs) {
      if (!config.id) {
        return NextResponse.json(
          { success: false, message: 'All configurations must have an ID' },
          { status: 400 }
        );
      }

      if (config.retailer_commission_amount < 0 || config.customer_cashback_amount < 0) {
        return NextResponse.json(
          { success: false, message: 'Commission and cashback amounts cannot be negative' },
          { status: 400 }
        );
      }
    }

    const updatedConfigs = [];
    const errors = [];

    // Process each configuration
    for (const config of configs) {
      try {
        const { data, error } = await supabase
          .from('service_commission_config')
          .update({
            service_display_name: config.service_display_name,
            retailer_commission_amount: parseFloat(config.retailer_commission_amount) || 0,
            retailer_commission_enabled: config.retailer_commission_enabled !== false,
            customer_cashback_amount: parseFloat(config.customer_cashback_amount) || 0,
            customer_cashback_enabled: config.customer_cashback_enabled !== false,
            min_transaction_amount: parseFloat(config.min_transaction_amount) || 1,
            max_transaction_amount: parseFloat(config.max_transaction_amount) || 50000,
            description: config.description || '',
            is_active: config.is_active !== false,
            updated_by: user.id
          })
          .eq('id', config.id)
          .select()
          .single();

        if (error) {
          errors.push({
            id: config.id,
            service_type: config.service_type,
            error: error.message
          });
        } else if (data) {
          updatedConfigs.push(data);
        }
      } catch (configError: any) {
        errors.push({
          id: config.id,
          service_type: config.service_type,
          error: configError.message
        });
      }
    }

    const successCount = updatedConfigs.length;
    const errorCount = errors.length;

    if (errorCount === 0) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated ${successCount} service configurations`,
        data: {
          updated: updatedConfigs,
          summary: {
            total: configs.length,
            success: successCount,
            errors: errorCount
          }
        }
      });
    } else if (successCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Updated ${successCount} configurations with ${errorCount} errors`,
        data: {
          updated: updatedConfigs,
          errors: errors,
          summary: {
            total: configs.length,
            success: successCount,
            errors: errorCount
          }
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `Failed to update any configurations. ${errorCount} errors occurred.`,
        data: {
          errors: errors,
          summary: {
            total: configs.length,
            success: successCount,
            errors: errorCount
          }
        }
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Bulk update service commission config error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}