-- Migration: Update Torrent Electricity Operators to use opid 170
-- All torrent separate billers are Permanently Deactivated, all cities are merged under opid 170
-- Date: 2024-12-19

-- Update all Torrent electricity operators to use opid 170
-- This includes all city-specific Torrent operators that are now merged

UPDATE kwikapi_billers
SET 
  operator_id = 170,
  operator_name = 'Torrent Power Limited',
  status = 1,
  biller_status = 'on',
  is_active = true,
  message = 'All Torrent cities merged under single operator',
  updated_at = NOW()
WHERE 
  operator_name LIKE '%Torrent%' 
  AND service_type = 'ELC'
  AND operator_id != 170;

-- Deactivate old separate Torrent operators (keep for reference but mark as inactive)
UPDATE kwikapi_billers
SET 
  is_active = false,
  biller_status = 'off',
  status = 0,
  message = 'Permanently deactivated - merged into opid 170',
  updated_at = NOW()
WHERE 
  operator_name LIKE '%Torrent%' 
  AND service_type = 'ELC'
  AND operator_id != 170;

-- Ensure the main Torrent operator (opid 170) is active
UPDATE kwikapi_billers
SET 
  is_active = true,
  biller_status = 'on',
  status = 1,
  operator_name = 'Torrent Power Limited',
  message = 'All Torrent cities merged under this operator',
  description = 'Torrent Power Limited - All cities (Ahmedabad, Surat, Gandhinagar, Dahej, Dholera, Sanand, Bhiwandi, Agra)',
  updated_at = NOW()
WHERE 
  operator_id = 170
  AND service_type = 'ELC';

-- Log the changes
DO $$
DECLARE
  updated_count INTEGER;
  deactivated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM kwikapi_billers
  WHERE operator_id = 170 AND service_type = 'ELC' AND is_active = true;
  
  SELECT COUNT(*) INTO deactivated_count
  FROM kwikapi_billers
  WHERE operator_name LIKE '%Torrent%' 
    AND service_type = 'ELC' 
    AND operator_id != 170 
    AND is_active = false;
  
  RAISE NOTICE 'Torrent operator migration completed:';
  RAISE NOTICE '  - Active Torrent operator (opid 170): %', updated_count;
  RAISE NOTICE '  - Deactivated old Torrent operators: %', deactivated_count;
END $$;

-- Update recharge_operators table if it exists
UPDATE recharge_operators
SET 
  kwikapi_opid = 170,
  operator_name = 'Torrent Power Limited',
  is_active = true,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{merged_cities}',
    '["Ahmedabad", "Surat", "Gandhinagar", "Dahej", "Dholera", "Sanand", "Bhiwandi", "Agra"]'::jsonb
  ),
  updated_at = NOW()
WHERE 
  operator_name LIKE '%Torrent%' 
  AND service_type = 'ELECTRICITY'
  AND kwikapi_opid != 170;

-- Deactivate old Torrent operators in recharge_operators
UPDATE recharge_operators
SET 
  is_active = false,
  metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{deactivation_reason}',
    '"Merged into opid 170"'::jsonb
  ),
  updated_at = NOW()
WHERE 
  operator_name LIKE '%Torrent%' 
  AND service_type = 'ELECTRICITY'
  AND kwikapi_opid != 170;

COMMENT ON TABLE kwikapi_billers IS 'Stores KwikAPI biller/operator information synced from their API. Torrent operators merged under opid 170 as of 2024-12-19.';
