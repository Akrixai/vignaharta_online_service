-- Migration: Fix PREPAID mobile operators to show only actual mobile recharge operators
-- This removes non-mobile operators (broadband, insurance, gas, water, etc.) from PREPAID service type

-- Step 1: Mark all DATACARD operators as inactive for PREPAID
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND (
    operator_name ILIKE '%datacard%' OR
    operator_name ILIKE '%mblaze%' OR
    operator_name ILIKE '%mbrowse%' OR
    operator_name ILIKE '%netconnect%' OR
    operator_name ILIKE '%photon%'
  );

-- Step 2: Mark all non-mobile operators as inactive for PREPAID
-- These include: insurance, gas, water, broadband, cable, fastag, etc.
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND kwikapi_opid NOT IN (
    1,   -- Airtel
    3,   -- Idea / VI
    4,   -- BSNL Topup
    5,   -- BSNL Special
    8,   -- Jio
    12,  -- Videocon (inactive but keep for reference)
    13,  -- Videocon Special (inactive but keep for reference)
    14,  -- MTNL
    15,  -- MTNL Special
    21,  -- Vodafone / VI
    178, -- VI Official
    179, -- BSNL Topup Official
    180, -- BSNL Special Official
    181, -- Jio Official
    182, -- MTNL Official
    183, -- MTNL Spl Official
    177  -- Airtel Official
  );

-- Step 3: Ensure the main mobile operators are active
UPDATE recharge_operators
SET is_active = true
WHERE service_type = 'PREPAID'
  AND kwikapi_opid IN (1, 3, 4, 5, 8, 14, 15, 21, 177, 178, 179, 180, 181, 182, 183);

-- Step 4: Remove duplicate operators - keep only the official/main ones
-- Deactivate duplicate Airtel entries (keep AIRTEL_OFFICIAL_177)
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND operator_name ILIKE '%airtel%'
  AND kwikapi_opid = 1
  AND operator_code NOT IN ('AIRTEL_OFFICIAL_177', 'AIRTEL');

-- Deactivate duplicate Jio entries (keep JIO_OFFICIAL_181)
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND operator_name ILIKE '%jio%'
  AND kwikapi_opid = 8
  AND operator_code NOT IN ('JIO_OFFICIAL_181', 'JIO_8', 'RELIANCE_JIO_8');

-- Deactivate duplicate VI entries (keep VI_OFFICIAL_178 and VI)
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND (operator_name ILIKE '%vodafone%' OR operator_name ILIKE '%idea%' OR operator_name = 'VI')
  AND operator_code NOT IN ('VI_OFFICIAL_178', 'VI', 'VODAFONE_21', 'IDEA_3');

-- Deactivate duplicate BSNL entries (keep BSNL_TOPUP_OFFICIAL_179 and BSNL_SPECIAL_OFFICIAL_180)
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND operator_name ILIKE '%bsnl%'
  AND operator_code NOT IN ('BSNL_TOPUP_OFFICIAL_179', 'BSNL_SPECIAL_OFFICIAL_180', 'BSNL', 'BSNL_SPECIAL_5');

-- Deactivate duplicate MTNL entries (keep MTNL_OFFICIAL_182)
UPDATE recharge_operators
SET is_active = false
WHERE service_type = 'PREPAID'
  AND operator_name ILIKE '%mtnl%'
  AND operator_code NOT IN ('MTNL_OFFICIAL_182', 'MTNL_SPL_OFFICIAL_183');

-- Step 5: Verify the results
SELECT 
  operator_code,
  operator_name,
  kwikapi_opid,
  is_active,
  commission_rate
FROM recharge_operators
WHERE service_type = 'PREPAID'
  AND is_active = true
ORDER BY operator_name;

-- Expected result: Only these operators should be active:
-- 1. Airtel Official
-- 2. BSNL Topup / BSNL Topup Official
-- 3. BSNL Special / BSNL Special Official
-- 4. Idea
-- 5. Jio Official / Reliance Jio
-- 6. MTNL Official
-- 7. MTNL Spl Official
-- 8. VI / VI Official
-- 9. Vodafone
-- 10. Vodafone Idea
