-- Create service commission and cashback configuration table
-- This allows admins to set commission and cashback rates for different service types

CREATE TABLE IF NOT EXISTS service_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type VARCHAR(50) NOT NULL UNIQUE,
    service_display_name VARCHAR(100) NOT NULL,
    
    -- Retailer Commission (in INR)
    retailer_commission_amount DECIMAL(10,2) DEFAULT 0.00,
    retailer_commission_enabled BOOLEAN DEFAULT true,
    
    -- Customer Cashback (in INR)
    customer_cashback_amount DECIMAL(10,2) DEFAULT 0.00,
    customer_cashback_enabled BOOLEAN DEFAULT true,
    
    -- Minimum and Maximum transaction amounts for commission/cashback eligibility
    min_transaction_amount DECIMAL(10,2) DEFAULT 1.00,
    max_transaction_amount DECIMAL(10,2) DEFAULT 50000.00,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_service_commission_config_service_type ON service_commission_config(service_type);
CREATE INDEX IF NOT EXISTS idx_service_commission_config_active ON service_commission_config(is_active);

-- Insert default configuration for all service types
INSERT INTO service_commission_config (
    service_type, 
    service_display_name, 
    retailer_commission_amount, 
    customer_cashback_amount,
    description
) VALUES 
    ('GAS', 'Gas Bill Payment', 5.00, 2.00, 'Commission and cashback for gas bill payments'),
    ('Water', 'Water Bill Payment', 3.00, 1.50, 'Commission and cashback for water bill payments'),
    ('Insurance', 'Insurance Premium', 10.00, 5.00, 'Commission and cashback for insurance premium payments'),
    ('Broadband', 'Broadband Bill Payment', 8.00, 4.00, 'Commission and cashback for broadband bill payments'),
    ('Landline', 'Landline Bill Payment', 4.00, 2.00, 'Commission and cashback for landline bill payments'),
    ('DataCard', 'Data Card Recharge', 6.00, 3.00, 'Commission and cashback for data card recharges'),
    ('FASTag', 'FASTag Recharge', 7.00, 3.50, 'Commission and cashback for FASTag recharges'),
    ('CableTV', 'Cable TV Bill Payment', 5.00, 2.50, 'Commission and cashback for cable TV bill payments'),
    ('CreditCard', 'Credit Card Bill Payment', 12.00, 6.00, 'Commission and cashback for credit card bill payments')
ON CONFLICT (service_type) DO NOTHING;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_service_commission_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_service_commission_config_updated_at
    BEFORE UPDATE ON service_commission_config
    FOR EACH ROW
    EXECUTE FUNCTION update_service_commission_config_updated_at();

-- Create audit log table for tracking changes
CREATE TABLE IF NOT EXISTS service_commission_config_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_id UUID NOT NULL,
    service_type VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_service_commission_config()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO service_commission_config_audit (
            config_id, service_type, action, old_values, changed_by
        ) VALUES (
            OLD.id, OLD.service_type, 'DELETE', 
            row_to_json(OLD)::jsonb, OLD.updated_by
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO service_commission_config_audit (
            config_id, service_type, action, old_values, new_values, changed_by
        ) VALUES (
            NEW.id, NEW.service_type, 'UPDATE', 
            row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.updated_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO service_commission_config_audit (
            config_id, service_type, action, new_values, changed_by
        ) VALUES (
            NEW.id, NEW.service_type, 'INSERT', 
            row_to_json(NEW)::jsonb, NEW.created_by
        );
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger
CREATE TRIGGER trigger_audit_service_commission_config
    AFTER INSERT OR UPDATE OR DELETE ON service_commission_config
    FOR EACH ROW
    EXECUTE FUNCTION audit_service_commission_config();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON service_commission_config TO authenticated;
GRANT SELECT ON service_commission_config_audit TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE service_commission_config IS 'Configuration table for service-wise commission and cashback rates';
COMMENT ON COLUMN service_commission_config.service_type IS 'Service type identifier (matches kwikapi_billers.service_type)';
COMMENT ON COLUMN service_commission_config.retailer_commission_amount IS 'Fixed commission amount in INR for retailers';
COMMENT ON COLUMN service_commission_config.customer_cashback_amount IS 'Fixed cashback amount in INR for customers';
COMMENT ON COLUMN service_commission_config.min_transaction_amount IS 'Minimum transaction amount to be eligible for commission/cashback';
COMMENT ON COLUMN service_commission_config.max_transaction_amount IS 'Maximum transaction amount to be eligible for commission/cashback';