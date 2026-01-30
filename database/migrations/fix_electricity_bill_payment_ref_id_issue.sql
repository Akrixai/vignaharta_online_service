-- Fix Electricity Bill Payment ref_id Issue
-- This migration addresses the KwikAPI ref_id mismatch problem

-- Create a table to store bill fetch sessions to track ref_id usage
CREATE TABLE IF NOT EXISTS bill_fetch_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    operator_id UUID REFERENCES recharge_operators(id),
    consumer_number VARCHAR NOT NULL,
    mobile_number VARCHAR NOT NULL,
    ref_id VARCHAR NOT NULL,
    bill_data JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '30 minutes'),
    used_for_payment BOOLEAN DEFAULT FALSE,
    payment_transaction_id UUID REFERENCES recharge_transactions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_bill_fetch_sessions_user_consumer ON bill_fetch_sessions(user_id, consumer_number);
CREATE INDEX IF NOT EXISTS idx_bill_fetch_sessions_ref_id ON bill_fetch_sessions(ref_id);
CREATE INDEX IF NOT EXISTS idx_bill_fetch_sessions_expires_at ON bill_fetch_sessions(expires_at);

-- Add a function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_bill_fetch_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM bill_fetch_sessions 
    WHERE expires_at < now() AND used_for_payment = FALSE;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_bill_fetch_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bill_fetch_sessions_updated_at
    BEFORE UPDATE ON bill_fetch_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_bill_fetch_sessions_updated_at();

-- Add a column to recharge_transactions to track the bill fetch session
ALTER TABLE recharge_transactions 
ADD COLUMN IF NOT EXISTS bill_fetch_session_id UUID REFERENCES bill_fetch_sessions(id);

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_recharge_transactions_bill_fetch_session ON recharge_transactions(bill_fetch_session_id);

-- Add comments for documentation
COMMENT ON TABLE bill_fetch_sessions IS 'Stores bill fetch sessions to ensure ref_id consistency between bill fetch and payment';
COMMENT ON COLUMN bill_fetch_sessions.ref_id IS 'The ref_id returned by KwikAPI bill fetch - must be used for payment';
COMMENT ON COLUMN bill_fetch_sessions.expires_at IS 'Session expires after 30 minutes to prevent stale ref_id usage';
COMMENT ON COLUMN bill_fetch_sessions.used_for_payment IS 'Tracks if this ref_id has been used for a payment attempt';
COMMENT ON COLUMN recharge_transactions.bill_fetch_session_id IS 'Links transaction to the bill fetch session that provided the ref_id';