-- Migration: Add service fee breakdown with GST and platform fee
-- This migration adds support for 2% GST and ₹5 platform fee on service applications

-- Add columns to applications table for fee breakdown
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gst_percentage NUMERIC DEFAULT 2,
ADD COLUMN IF NOT EXISTS gst_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS platform_fee NUMERIC DEFAULT 5,
ADD COLUMN IF NOT EXISTS total_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED'));

-- Add comment to explain the fee structure
COMMENT ON COLUMN applications.base_amount IS 'Base service amount before GST and platform fee';
COMMENT ON COLUMN applications.gst_percentage IS 'GST percentage applied (default 2%)';
COMMENT ON COLUMN applications.gst_amount IS 'Calculated GST amount';
COMMENT ON COLUMN applications.platform_fee IS 'Platform fee (default ₹5)';
COMMENT ON COLUMN applications.total_amount IS 'Total amount = base_amount + gst_amount + platform_fee';
COMMENT ON COLUMN applications.payment_status IS 'Payment status: PENDING (not debited), PAID (debited after approval), REFUNDED';

-- Update existing applications to have proper fee breakdown
UPDATE applications
SET 
  base_amount = amount,
  gst_percentage = 0,
  gst_amount = 0,
  platform_fee = 0,
  total_amount = amount,
  payment_status = CASE 
    WHEN status = 'APPROVED' THEN 'PAID'
    WHEN status = 'REJECTED' THEN 'REFUNDED'
    ELSE 'PENDING'
  END
WHERE base_amount IS NULL OR base_amount = 0;
