-- Fix Mobile Recharge Operators and Detection Issues
-- This migration addresses:
-- 1. Duplicate mobile operators in PREPAID service type
-- 2. Incorrect service type assignments
-- 3. Operator detection mapping issues

-- First, disable all duplicate/incorrect mobile operators
UPDATE recharge_operators 
SET is_active = false 
WHERE service_type = 'PREPAID' 
AND kwikapi_opid IN (1, 3, 4, 5, 8, 14, 15, 21) 
AND operator_code NOT IN (
    'AIRTEL_OFFICIAL_177',
    'VI_OFFICIAL_178', 
    'BSNL_TOPUP_OFFICIAL_179',
    'BSNL_SPECIAL_OFFICIAL_180',
    'JIO_OFFICIAL_181',
    'MTNL_OFFICIAL_182',
    'MTNL_SPL_OFFICIAL_183'
);

-- Update the official mobile operators with correct names and ensure they're active
UPDATE recharge_operators 
SET 
    operator_name = 'Airtel Prepaid',
    is_active = true,
    commission_rate = 1.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 1.00
WHERE operator_code = 'AIRTEL_OFFICIAL_177';

UPDATE recharge_operators 
SET 
    operator_name = 'VI Prepaid',
    is_active = true,
    commission_rate = 1.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 1.50
WHERE operator_code = 'VI_OFFICIAL_178';

UPDATE recharge_operators 
SET 
    operator_name = 'BSNL Prepaid',
    is_active = true,
    commission_rate = 2.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 2.00
WHERE operator_code = 'BSNL_TOPUP_OFFICIAL_179';

UPDATE recharge_operators 
SET 
    operator_name = 'BSNL Special',
    is_active = true,
    commission_rate = 2.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 2.00
WHERE operator_code = 'BSNL_SPECIAL_OFFICIAL_180';

UPDATE recharge_operators 
SET 
    operator_name = 'Jio Prepaid',
    is_active = true,
    commission_rate = 0.30,
    cashback_min_percentage = 0.10,
    cashback_max_percentage = 0.20
WHERE operator_code = 'JIO_OFFICIAL_181';

UPDATE recharge_operators 
SET 
    operator_name = 'MTNL Prepaid',
    is_active = true,
    commission_rate = 2.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 1.50
WHERE operator_code = 'MTNL_OFFICIAL_182';

UPDATE recharge_operators 
SET 
    operator_name = 'MTNL Special',
    is_active = true,
    commission_rate = 2.50,
    cashback_min_percentage = 0.50,
    cashback_max_percentage = 1.50
WHERE operator_code = 'MTNL_SPL_OFFICIAL_183';

-- Move non-mobile operators to correct service types
-- Move broadband/internet operators to a new BROADBAND service type
UPDATE recharge_operators 
SET service_type = 'BROADBAND'
WHERE service_type = 'PREPAID' 
AND (
    operator_name LIKE '%Broadband%' OR
    operator_name LIKE '%Fibernet%' OR
    operator_name LIKE '%Internet%' OR
    operator_name LIKE '%Cable%' OR
    operator_name LIKE '%Network%' OR
    operator_name LIKE '%Fiber%' OR
    operator_name LIKE '%WiFi%' OR
    operator_name LIKE '%ISP%'
);

-- Move gas operators to GAS service type
UPDATE recharge_operators 
SET service_type = 'GAS'
WHERE service_type = 'PREPAID' 
AND operator_name LIKE '%Gas%';

-- Move water operators to WATER service type
UPDATE recharge_operators 
SET service_type = 'WATER'
WHERE service_type = 'PREPAID' 
AND (
    operator_name LIKE '%Water%' OR
    operator_name LIKE '%Jal%' OR
    operator_name LIKE '%Municipal%' OR
    operator_name LIKE '%Corporation%'
);

-- Move insurance operators to INSURANCE service type
UPDATE recharge_operators 
SET service_type = 'INSURANCE'
WHERE service_type = 'PREPAID' 
AND operator_name LIKE '%Insurance%';

-- Move FASTag operators to FASTAG service type
UPDATE recharge_operators 
SET service_type = 'FASTAG'
WHERE service_type = 'PREPAID' 
AND (
    operator_name LIKE '%FASTag%' OR
    operator_name LIKE '%Fastag%' OR
    operator_name LIKE '%NETC%'
);

-- Add new service types to enum if they don't exist
-- Note: This requires manual execution as ALTER TYPE needs to be done carefully
-- ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'BROADBAND';
-- ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'INSURANCE';
-- ALTER TYPE recharge_service_type ADD VALUE IF NOT EXISTS 'FASTAG';

-- Clean up operator detection cache
DELETE FROM operator_detection_cache WHERE expires_at < NOW();

-- Update circle codes to match KWIKAPI format
UPDATE recharge_circles SET circle_code = '1' WHERE circle_name = 'DELHI';
UPDATE recharge_circles SET circle_code = '2' WHERE circle_name = 'MUMBAI';
UPDATE recharge_circles SET circle_code = '3' WHERE circle_name = 'KOLKATA';
UPDATE recharge_circles SET circle_code = '4' WHERE circle_name = 'Maharashtra';
UPDATE recharge_circles SET circle_code = '5' WHERE circle_name = 'Gujarat';
UPDATE recharge_circles SET circle_code = '6' WHERE circle_name = 'Andhra Pradesh';
UPDATE recharge_circles SET circle_code = '7' WHERE circle_name = 'Tamil Nadu';
UPDATE recharge_circles SET circle_code = '8' WHERE circle_name = 'Karnataka';
UPDATE recharge_circles SET circle_code = '9' WHERE circle_name = 'Kerala';
UPDATE recharge_circles SET circle_code = '10' WHERE circle_name = 'Punjab';
UPDATE recharge_circles SET circle_code = '11' WHERE circle_name = 'Haryana';
UPDATE recharge_circles SET circle_code = '12' WHERE circle_name = 'Rajasthan';
UPDATE recharge_circles SET circle_code = '13' WHERE circle_name = 'Uttar Pradesh (East)';
UPDATE recharge_circles SET circle_code = '14' WHERE circle_name = 'Uttar Pradesh (West)';
UPDATE recharge_circles SET circle_code = '15' WHERE circle_name = 'Madhya Pradesh';
UPDATE recharge_circles SET circle_code = '16' WHERE circle_name = 'West Bengal';
UPDATE recharge_circles SET circle_code = '17' WHERE circle_name = 'Bihar';
UPDATE recharge_circles SET circle_code = '18' WHERE circle_name = 'Orissa';
UPDATE recharge_circles SET circle_code = '19' WHERE circle_name = 'Assam';
UPDATE recharge_circles SET circle_code = '20' WHERE circle_name = 'North East';
UPDATE recharge_circles SET circle_code = '21' WHERE circle_name = 'Himachal Pradesh';
UPDATE recharge_circles SET circle_code = '22' WHERE circle_name = 'Jammu & Kashmir';
UPDATE recharge_circles SET circle_code = '23' WHERE circle_name = 'Chennai';

-- Create a view for active mobile operators only
CREATE OR REPLACE VIEW active_mobile_operators AS
SELECT 
    id,
    operator_code,
    operator_name,
    service_type,
    logo_url,
    min_amount,
    max_amount,
    kwikapi_opid,
    commission_rate,
    cashback_enabled,
    cashback_min_percentage,
    cashback_max_percentage,
    metadata
FROM recharge_operators 
WHERE service_type = 'PREPAID' 
AND is_active = true 
AND kwikapi_opid IN (1, 3, 4, 5, 8, 14, 15, 21, 177, 178, 179, 180, 181, 182, 183)
ORDER BY operator_name;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_recharge_operators_kwikapi_service 
ON recharge_operators(kwikapi_opid, service_type, is_active);

-- Add index for operator detection
CREATE INDEX IF NOT EXISTS idx_operator_detection_expires 
ON operator_detection_cache(expires_at);

COMMIT;