-- Add global electricity commission configuration
-- This allows admin to set a single commission rate for all electricity operators

CREATE TABLE IF NOT EXISTS recharge_global_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default electricity commission
INSERT INTO recharge_global_config (config_key, config_value, description) 
VALUES ('electricity_commission_rate', '1.0', 'Global commission rate for all electricity bill payments (percentage)')
ON CONFLICT (config_key) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_recharge_global_config_updated_at 
    BEFORE UPDATE ON recharge_global_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMIT;
