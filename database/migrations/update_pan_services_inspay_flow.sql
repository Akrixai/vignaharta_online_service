-- Migration: Update PAN Services for InsPay Flow
-- Description: Add fields for instant payment deduction, 24-hour expiry tracking, and refund processing

-- Add new columns to pan_services table
ALTER TABLE pan_services
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'PENDING' 
  CHECK (payment_status IN ('PENDING', 'DEBITED', 'REFUNDED')),
ADD COLUMN IF NOT EXISTS payment_debited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_processed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS refund_processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_transaction_id UUID REFERENCES transactions(id),
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Update status check constraint to include EXPIRED
ALTER TABLE pan_services DROP CONSTRAINT IF EXISTS pan_services_status_check;
ALTER TABLE pan_services ADD CONSTRAINT pan_services_status_check 
  CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE', 'EXPIRED'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pan_services_expires_at 
  ON pan_services(expires_at) 
  WHERE status IN ('PENDING', 'PROCESSING') AND payment_status = 'DEBITED' AND refund_processed = false;

CREATE INDEX IF NOT EXISTS idx_pan_services_inspay_txid 
  ON pan_services(inspay_txid) 
  WHERE inspay_txid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pan_services_payment_status 
  ON pan_services(payment_status, status);

CREATE INDEX IF NOT EXISTS idx_pan_services_user_status 
  ON pan_services(user_id, status, created_at DESC);

-- Add comment for documentation
COMMENT ON COLUMN pan_services.payment_status IS 'Payment status: PENDING (not debited), DEBITED (instant deduction), REFUNDED (refund processed)';
COMMENT ON COLUMN pan_services.payment_debited_at IS 'Timestamp when payment was debited from wallet';
COMMENT ON COLUMN pan_services.refund_processed IS 'Whether refund has been processed for failed/expired application';
COMMENT ON COLUMN pan_services.refund_processed_at IS 'Timestamp when refund was processed';
COMMENT ON COLUMN pan_services.refund_transaction_id IS 'Reference to refund transaction in transactions table';
COMMENT ON COLUMN pan_services.expires_at IS '24-hour expiry timestamp for incomplete applications';
COMMENT ON COLUMN pan_services.webhook_received_at IS 'Timestamp when webhook was received from InsPay';
COMMENT ON COLUMN pan_services.completed_at IS 'Timestamp when application was completed (success/failure)';

-- Update existing records to set expires_at (24 hours from created_at)
UPDATE pan_services 
SET expires_at = created_at + INTERVAL '24 hours'
WHERE expires_at IS NULL AND status IN ('PENDING', 'PROCESSING');

-- Update existing records with payment_status based on current status
UPDATE pan_services 
SET payment_status = CASE 
  WHEN status = 'SUCCESS' THEN 'DEBITED'
  WHEN status = 'FAILURE' AND refund_processed = true THEN 'REFUNDED'
  WHEN status IN ('PENDING', 'PROCESSING') THEN 'DEBITED'
  ELSE 'PENDING'
END
WHERE payment_status = 'PENDING';

-- Create function to auto-set expires_at on insert
CREATE OR REPLACE FUNCTION set_pan_service_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.created_at + INTERVAL '24 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set expires_at
DROP TRIGGER IF EXISTS trigger_set_pan_service_expiry ON pan_services;
CREATE TRIGGER trigger_set_pan_service_expiry
  BEFORE INSERT ON pan_services
  FOR EACH ROW
  EXECUTE FUNCTION set_pan_service_expiry();

-- Create view for expired services monitoring
CREATE OR REPLACE VIEW pan_services_expired_pending AS
SELECT 
  ps.*,
  u.name as user_name,
  u.email as user_email,
  w.balance as current_wallet_balance
FROM pan_services ps
JOIN users u ON ps.user_id = u.id
LEFT JOIN wallets w ON w.user_id = u.id
WHERE ps.status IN ('PENDING', 'PROCESSING')
  AND ps.payment_status = 'DEBITED'
  AND ps.refund_processed = false
  AND ps.expires_at < NOW()
ORDER BY ps.expires_at ASC;

-- Grant permissions
GRANT SELECT ON pan_services_expired_pending TO authenticated;

-- Add helpful comments
COMMENT ON VIEW pan_services_expired_pending IS 'View of PAN services that have expired (24 hours) and need refund processing';
