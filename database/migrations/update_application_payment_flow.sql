-- Migration: Update Application Payment Flow
-- Description: Modify payment flow to deduct wallet balance on submission and refund on rejection
-- Date: 2024-12-09

-- Add refund tracking columns to applications table if not exists
DO $$ 
BEGIN
    -- Add refund_processed column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'refund_processed'
    ) THEN
        ALTER TABLE applications ADD COLUMN refund_processed BOOLEAN DEFAULT FALSE;
        COMMENT ON COLUMN applications.refund_processed IS 'Whether refund has been processed for rejected application';
    END IF;

    -- Add refund_processed_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'refund_processed_at'
    ) THEN
        ALTER TABLE applications ADD COLUMN refund_processed_at TIMESTAMPTZ;
        COMMENT ON COLUMN applications.refund_processed_at IS 'When refund was processed';
    END IF;

    -- Add refund_transaction_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' AND column_name = 'refund_transaction_id'
    ) THEN
        ALTER TABLE applications ADD COLUMN refund_transaction_id UUID REFERENCES transactions(id);
        COMMENT ON COLUMN applications.refund_transaction_id IS 'Transaction ID for refund';
    END IF;
END $$;

-- Update payment_status check constraint to include REFUNDED
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_payment_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_payment_status_check 
    CHECK (payment_status IN ('PENDING', 'PAID', 'REFUNDED'));

COMMENT ON COLUMN applications.payment_status IS 'Payment status: PENDING (not debited), PAID (debited on submission), REFUNDED (refunded on rejection)';

-- Create index for faster queries on payment_status and refund_processed
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);
CREATE INDEX IF NOT EXISTS idx_applications_refund_processed ON applications(refund_processed) WHERE refund_processed = FALSE;
