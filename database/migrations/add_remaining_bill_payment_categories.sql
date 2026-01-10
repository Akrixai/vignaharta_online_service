-- Add remaining bill payment categories implementation
-- This migration adds Gas, Water, Broadband, Landline, and Insurance bill payment support

-- First, add new service types to the enum
DO $$ 
BEGIN
    -- Add new service types if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'recharge_service_type') THEN
        CREATE TYPE recharge_service_type AS ENUM ('PREPAID', 'POSTPAID', 'DTH', 'ELECTRICITY');
    END IF;
    
    -- Add new values to existing enum
    ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'GAS';
    ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'WATER';
    ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'BROADBAND';
    ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'LANDLINE';
    ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'INSURANCE';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create category-level commission configuration table
CREATE TABLE IF NOT EXISTS category_commission_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type recharge_service_type NOT NULL UNIQUE,
    commission_rate NUMERIC(5,2) DEFAULT 2.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
    cashback_enabled BOOLEAN DEFAULT false,
    cashback_min_percentage NUMERIC(5,2) DEFAULT 0.50 CHECK (cashback_min_percentage >= 0 AND cashback_min_percentage <= 100),
    cashback_max_percentage NUMERIC(5,2) DEFAULT 2.00 CHECK (cashback_max_percentage >= 0 AND cashback_max_percentage <= 100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_cashback_range CHECK (cashback_max_percentage >= cashback_min_percentage)
);

-- Insert default commission configuration for new categories
INSERT INTO category_commission_config (service_type, commission_rate, cashback_enabled, cashback_min_percentage, cashback_max_percentage) VALUES
('GAS', 2.50, true, 0.50, 2.00),
('WATER', 2.00, true, 0.50, 1.50),
('BROADBAND', 3.00, true, 1.00, 2.50),
('LANDLINE', 2.50, true, 0.50, 2.00),
('INSURANCE', 1.50, true, 0.25, 1.00)
ON CONFLICT (service_type) DO NOTHING;

-- Also add configuration for existing categories
INSERT INTO category_commission_config (service_type, commission_rate, cashback_enabled, cashback_min_percentage, cashback_max_percentage) VALUES
('ELECTRICITY', 2.00, true, 0.50, 2.00),
('DTH', 2.50, true, 1.00, 2.50),
('PREPAID', 1.50, true, 0.25, 1.50),
('POSTPAID', 2.00, true, 0.50, 2.00)
ON CONFLICT (service_type) DO NOTHING;

-- Add missing operators to kwikapi_billers table
-- Gas Operators
INSERT INTO kwikapi_billers (operator_id, operator_name, service_type, status, biller_status, bill_fetch, support_validation, bbps_enabled, amount_minimum, amount_maximum, is_active) VALUES
(90, 'Mahanagar Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 200000, true),
(91, 'Tripura Natural Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(92, 'Torrent Gas Moradabad Limited formerly Siti Energy Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(93, 'Sabarmati Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(94, 'Indraprastha Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(95, 'Haryana City Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(96, 'Gujarat Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(97, 'Adani Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(138, 'Vadodara Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(139, 'Unique Central Piped Gases', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(140, 'Maharashtra Natural Gas (MNGL)', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(160, 'IndianOil - Adani Gas', 'Gas', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(161, 'Charotar Gas Sahakari Mandali', 'Gas', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(163, 'Central UP Gas Limited', 'Gas', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(164, 'Aavantika Gas', 'Gas', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(264, 'Megha Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(265, 'Gail India Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(266, 'Green Gas Limited(GGL)', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(267, 'Naveriya Gas Pvt Ltd', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(268, 'IRM Energy Private Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(269, 'GAIL Gas Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(270, 'Bhagyanagar Gas Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(272, 'Assam Gas Company Limited', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(512, 'AGP CGD India Pvt Ltd', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(513, 'AGP City Gas Pvt Ltd', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(514, 'Torrent Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(516, 'Indian Oil Corporation Ltd-Piped Gas', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(517, 'Godavari Gas Pvt Ltd', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(518, 'Purba Bharati Gas Pvt Ltd', 'GAS', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true)
ON CONFLICT (operator_id) DO NOTHING;

-- Water Operators (Top 20 most popular)
INSERT INTO kwikapi_billers (operator_id, operator_name, service_type, status, biller_status, bill_fetch, support_validation, bbps_enabled, amount_minimum, amount_maximum, is_active) VALUES
(99, 'Uttarakhand Jal Sansthan', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(100, 'Urban Improvement Trust (UIT) - BHIWADI', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(101, 'Municipal Corporation of Gurugram', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(102, 'Delhi Jal Board', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(146, 'Ujjain Nagar Nigam - PHED', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(147, 'Surat Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(148, 'Pune Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(149, 'New Delhi Municipal Council (NDMC)', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(150, 'Municipal Corporation Ludhiana', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(151, 'Municipal Corporation Jalandhar', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(152, 'Jabalpur Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(154, 'Indore Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(155, 'Hyderabad Metropolitan Water Supply and Sewerage Board', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(156, 'Gwalior Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(157, 'Greater Warangal Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(158, 'Bhopal Municipal Corporation', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(159, 'Bangalore Water Supply and Sewerage Board', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(234, 'Haryana Urban Development Authority', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(235, 'Punjab Municipal Corporations/Councils', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(236, 'Kerala Water Authority (KWA)', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(237, 'Delhi Development Aunthority (DDA) - Water', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(238, 'Municipal Corporation Chandigarh', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(500, 'MCGM Water Department', 'Water', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true)
ON CONFLICT (operator_id) DO NOTHING;

-- Broadband Operators (Top 20 most popular)
INSERT INTO kwikapi_billers (operator_id, operator_name, service_type, status, biller_status, bill_fetch, support_validation, bbps_enabled, amount_minimum, amount_maximum, is_active) VALUES
(108, 'Tikona Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(109, 'Connect Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 100, 9999, true),
(136, 'Hathway Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(137, 'ACT Fibernet', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(166, 'TTN BroadBand', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(167, 'Spectranet Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(168, 'Airtel Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(169, 'Nextra Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(250, 'Vfibernet Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(251, 'Fusionnet Web Services Private Limited', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(252, 'Excell Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(253, 'Netplus Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(254, 'Mnet Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(255, 'Timbl Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(256, 'Instalinks', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(257, 'ION', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(258, 'Swifttele Enterprises Private Limited', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(259, 'DEN Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(260, 'Comway Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(261, 'Flash Fibernet', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(262, 'Instanet Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(263, 'Asianet Broadband', 'Broadband', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true)
ON CONFLICT (operator_id) DO NOTHING;

-- Landline Operators
INSERT INTO kwikapi_billers (operator_id, operator_name, service_type, status, biller_status, bill_fetch, support_validation, bbps_enabled, amount_minimum, amount_maximum, is_active) VALUES
(103, 'Tata Docomo CDMA (LL)', 'Landline', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(104, 'MTNL - Mumbai(LL)', 'Landline', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(105, 'MTNL - Delhi(LL)', 'Landline', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 1, 49999, true),
(107, 'Airtel(LL)', 'Landline', 1, 'on', 'YES', 'NOT_SUPPORTED', 'YES', 10, 49999, true)
ON CONFLICT (operator_id) DO NOTHING;

-- Insurance Operators
INSERT INTO kwikapi_billers (operator_id, operator_name, service_type, status, biller_status, bill_fetch, support_validation, bbps_enabled, amount_minimum, amount_maximum, is_active) VALUES
(113, 'ICICI Prudential Life Insurance', 'Insurance', 1, 'off', 'YES', NULL, 'NO', 1, 49999, true)
ON CONFLICT (operator_id) DO NOTHING;

-- Update recharge_operators table to include new service types for existing operators
-- This will help with the existing recharge system integration
INSERT INTO recharge_operators (operator_code, operator_name, service_type, is_active, min_amount, max_amount, commission_rate, kwikapi_opid, cashback_enabled, cashback_min_percentage, cashback_max_percentage)
SELECT 
    'GAS_' || operator_id::text,
    operator_name,
    'GAS'::recharge_service_type,
    true,
    COALESCE(amount_minimum, 1),
    COALESCE(amount_maximum, 49999),
    2.50,
    operator_id,
    true,
    0.50,
    2.00
FROM kwikapi_billers 
WHERE service_type IN ('GAS', 'Gas') AND status = 1
ON CONFLICT (operator_code) DO NOTHING;

INSERT INTO recharge_operators (operator_code, operator_name, service_type, is_active, min_amount, max_amount, commission_rate, kwikapi_opid, cashback_enabled, cashback_min_percentage, cashback_max_percentage)
SELECT 
    'WATER_' || operator_id::text,
    operator_name,
    'WATER'::recharge_service_type,
    true,
    COALESCE(amount_minimum, 1),
    COALESCE(amount_maximum, 49999),
    2.00,
    operator_id,
    true,
    0.50,
    1.50
FROM kwikapi_billers 
WHERE service_type = 'Water' AND status = 1
ON CONFLICT (operator_code) DO NOTHING;

INSERT INTO recharge_operators (operator_code, operator_name, service_type, is_active, min_amount, max_amount, commission_rate, kwikapi_opid, cashback_enabled, cashback_min_percentage, cashback_max_percentage)
SELECT 
    'BROADBAND_' || operator_id::text,
    operator_name,
    'BROADBAND'::recharge_service_type,
    true,
    COALESCE(amount_minimum, 1),
    COALESCE(amount_maximum, 49999),
    3.00,
    operator_id,
    true,
    1.00,
    2.50
FROM kwikapi_billers 
WHERE service_type = 'Broadband' AND status = 1
ON CONFLICT (operator_code) DO NOTHING;

INSERT INTO recharge_operators (operator_code, operator_name, service_type, is_active, min_amount, max_amount, commission_rate, kwikapi_opid, cashback_enabled, cashback_min_percentage, cashback_max_percentage)
SELECT 
    'LANDLINE_' || operator_id::text,
    operator_name,
    'LANDLINE'::recharge_service_type,
    true,
    COALESCE(amount_minimum, 1),
    COALESCE(amount_maximum, 49999),
    2.50,
    operator_id,
    true,
    0.50,
    2.00
FROM kwikapi_billers 
WHERE service_type = 'Landline' AND status = 1
ON CONFLICT (operator_code) DO NOTHING;

INSERT INTO recharge_operators (operator_code, operator_name, service_type, is_active, min_amount, max_amount, commission_rate, kwikapi_opid, cashback_enabled, cashback_min_percentage, cashback_max_percentage)
SELECT 
    'INSURANCE_' || operator_id::text,
    operator_name,
    'INSURANCE'::recharge_service_type,
    true,
    COALESCE(amount_minimum, 1),
    COALESCE(amount_maximum, 49999),
    1.50,
    operator_id,
    true,
    0.25,
    1.00
FROM kwikapi_billers 
WHERE service_type = 'Insurance' AND status = 1
ON CONFLICT (operator_code) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kwikapi_billers_service_type_status ON kwikapi_billers(service_type, status);
CREATE INDEX IF NOT EXISTS idx_recharge_operators_service_type_active ON recharge_operators(service_type, is_active);
CREATE INDEX IF NOT EXISTS idx_category_commission_config_service_type ON category_commission_config(service_type);

-- Add comments for documentation
COMMENT ON TABLE category_commission_config IS 'Category-level commission and cashback configuration for bill payment services';
COMMENT ON COLUMN category_commission_config.service_type IS 'Service category (GAS, WATER, BROADBAND, etc.)';
COMMENT ON COLUMN category_commission_config.commission_rate IS 'Commission percentage for retailers (0-100%)';
COMMENT ON COLUMN category_commission_config.cashback_enabled IS 'Whether cashback is enabled for customers';
COMMENT ON COLUMN category_commission_config.cashback_min_percentage IS 'Minimum cashback percentage for customers';
COMMENT ON COLUMN category_commission_config.cashback_max_percentage IS 'Maximum cashback percentage for customers';