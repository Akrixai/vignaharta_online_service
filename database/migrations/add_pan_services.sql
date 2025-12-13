-- Migration: Add PAN Services and Commission Configuration
-- Date: 2024-12-12
-- Description: Add tables for PAN card services, commission configuration, and callback handling

-- Create ENUM types for PAN services
CREATE TYPE pan_service_type AS ENUM ('NEW_PAN', 'PAN_CORRECTION', 'INCOMPLETE_PAN');
CREATE TYPE pan_service_status AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILURE', 'CANCELLED');

-- PAN Commission Configuration table
CREATE TABLE pan_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type pan_service_type NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Commission percentage
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_price CHECK (price >= 0),
    CONSTRAINT valid_commission_rate CHECK (commission_rate >= 0 AND commission_rate <= 100)
);

-- PAN Services table (for tracking PAN applications)
CREATE TABLE pan_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type pan_service_type NOT NULL,
    order_id VARCHAR(100) NOT NULL, -- User-provided order ID
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status pan_service_status DEFAULT 'PENDING',
    
    -- InsPay API response fields
    inspay_txid VARCHAR(100), -- Transaction ID from InsPay
    inspay_opid VARCHAR(100), -- Operator ID from InsPay
    inspay_url TEXT, -- Redirection URL from InsPay
    
    -- Additional fields
    mobile_number VARCHAR(15), -- For NEW_PAN and PAN_CORRECTION
    mode VARCHAR(10), -- EKYC or ESIGN
    error_message TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_amount CHECK (amount >= 0),
    CONSTRAINT valid_commission CHECK (commission_amount >= 0),
    CONSTRAINT valid_mobile CHECK (mobile_number ~ '^[0-9]{10}$' OR mobile_number IS NULL),
    CONSTRAINT valid_mode CHECK (mode IN ('EKYC', 'ESIGN') OR mode IS NULL)
);

-- Create indexes for better performance
CREATE INDEX idx_pan_commission_config_service_type ON pan_commission_config(service_type);
CREATE INDEX idx_pan_commission_config_is_active ON pan_commission_config(is_active);
CREATE INDEX idx_pan_services_user_id ON pan_services(user_id);
CREATE INDEX idx_pan_services_status ON pan_services(status);
CREATE INDEX idx_pan_services_service_type ON pan_services(service_type);
CREATE INDEX idx_pan_services_order_id ON pan_services(order_id);
CREATE INDEX idx_pan_services_inspay_txid ON pan_services(inspay_txid);
CREATE INDEX idx_pan_services_created_at ON pan_services(created_at);

-- Apply updated_at triggers
CREATE TRIGGER update_pan_commission_config_updated_at 
    BEFORE UPDATE ON pan_commission_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pan_services_updated_at 
    BEFORE UPDATE ON pan_services 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default PAN commission configurations
INSERT INTO pan_commission_config (service_type, price, commission_rate, is_active) VALUES
('NEW_PAN', 107.00, 5.00, true),
('PAN_CORRECTION', 107.00, 5.00, true),
('INCOMPLETE_PAN', 0.00, 0.00, true);

-- Add comment for documentation
COMMENT ON TABLE pan_commission_config IS 'Configuration table for PAN service pricing and commission rates';
COMMENT ON TABLE pan_services IS 'Table to track PAN card service applications and their status';

COMMENT ON COLUMN pan_services.order_id IS 'User-provided order ID for tracking PAN applications';
COMMENT ON COLUMN pan_services.inspay_txid IS 'Transaction ID returned by InsPay API';
COMMENT ON COLUMN pan_services.inspay_opid IS 'Operator ID returned by InsPay API';
COMMENT ON COLUMN pan_services.inspay_url IS 'Redirection URL provided by InsPay for completing PAN application';
COMMENT ON COLUMN pan_services.mobile_number IS 'Mobile number for PAN application (required for NEW_PAN and PAN_CORRECTION)';
COMMENT ON COLUMN pan_services.mode IS 'PAN application mode: EKYC (without signature) or ESIGN (with signature and photo)';

COMMIT;