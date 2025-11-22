import { createClient } from './supabase';

export interface FeeBreakdown {
  base_amount: number;
  gst_percentage: number;
  gst_amount: number;
  platform_fee: number;
  total_amount: number;
}

/**
 * Get configuration value from database
 */
async function getConfig(key: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('site_configuration')
    .select('config_value')
    .eq('config_key', key)
    .single();

  if (error) {
    console.error(`Error fetching config ${key}:`, error);
    // Return default values
    if (key === 'gst_percentage') return '18';
    if (key === 'platform_fee') return '50';
    return '0';
  }

  return data.config_value;
}

/**
 * Calculate fee breakdown for an application
 */
export async function calculateApplicationFees(baseAmount: number): Promise<FeeBreakdown> {
  try {
    // Get configuration values
    const gstPercentageStr = await getConfig('gst_percentage');
    const platformFeeStr = await getConfig('platform_fee');

    const gstPercentage = parseFloat(gstPercentageStr);
    const platformFee = parseFloat(platformFeeStr);

    // Calculate GST amount
    const gstAmount = (baseAmount * gstPercentage) / 100;

    // Calculate total
    const totalAmount = baseAmount + gstAmount + platformFee;

    return {
      base_amount: baseAmount,
      gst_percentage: gstPercentage,
      gst_amount: parseFloat(gstAmount.toFixed(2)),
      platform_fee: platformFee,
      total_amount: parseFloat(totalAmount.toFixed(2))
    };
  } catch (error) {
    console.error('Error calculating fees:', error);
    // Return with default values
    return {
      base_amount: baseAmount,
      gst_percentage: 18,
      gst_amount: parseFloat(((baseAmount * 18) / 100).toFixed(2)),
      platform_fee: 50,
      total_amount: parseFloat((baseAmount + (baseAmount * 18) / 100 + 50).toFixed(2))
    };
  }
}

/**
 * Store fee breakdown in database
 */
export async function storeFeeBreakdown(
  applicationId: string,
  breakdown: FeeBreakdown
): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('application_fee_breakdown')
      .insert({
        application_id: applicationId,
        ...breakdown
      });

    if (error) {
      console.error('Error storing fee breakdown:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in storeFeeBreakdown:', error);
    throw error;
  }
}

/**
 * Get fee breakdown for an application
 */
export async function getFeeBreakdown(applicationId: string): Promise<FeeBreakdown | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('application_fee_breakdown')
      .select('*')
      .eq('application_id', applicationId)
      .single();

    if (error) {
      console.error('Error fetching fee breakdown:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getFeeBreakdown:', error);
    return null;
  }
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Get fee breakdown display text
 */
export function getFeeBreakdownText(breakdown: FeeBreakdown): string {
  return `
Service Fee: ${formatCurrency(breakdown.base_amount)}
GST (${breakdown.gst_percentage}%): ${formatCurrency(breakdown.gst_amount)}
Platform Fee: ${formatCurrency(breakdown.platform_fee)}
────────────────────────
Total Amount: ${formatCurrency(breakdown.total_amount)}
  `.trim();
}

/**
 * Calculate recurring charge next date
 */
export function calculateNextChargeDate(chargeType: 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY'): Date {
  const now = new Date();
  
  switch (chargeType) {
    case 'QUARTERLY':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'HALF_YEARLY':
      now.setMonth(now.getMonth() + 6);
      break;
    case 'YEARLY':
      now.setFullYear(now.getFullYear() + 1);
      break;
  }
  
  return now;
}

/**
 * Get recurring charge configuration
 */
export async function getRecurringChargeConfig(): Promise<{
  enabled: boolean;
  type: 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
  amount: number;
}> {
  try {
    const enabled = (await getConfig('recurring_charge_enabled')) === 'true';
    const type = (await getConfig('recurring_charge_type')) as 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
    const amount = parseFloat(await getConfig('recurring_charge_amount'));

    return { enabled, type, amount };
  } catch (error) {
    console.error('Error fetching recurring charge config:', error);
    return {
      enabled: false,
      type: 'QUARTERLY',
      amount: 500
    };
  }
}
