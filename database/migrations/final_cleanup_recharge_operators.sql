-- Final Cleanup: Remove Duplicate Recharge Operators
-- This migration ensures no duplicate operators exist in the system
-- Run Date: December 5, 2024

-- Step 1: Identify and disable duplicate operators (keep only one per operator_name + service_type)
WITH ranked_operators AS (
  SELECT 
    id,
    operator_name,
    service_type,
    ROW_NUMBER() OVER (
      PARTITION BY operator_name, service_type 
      ORDER BY 
        CASE WHEN kwikapi_opid IS NOT NULL THEN 0 ELSE 1 END, -- Prefer operators with kwikapi_opid
        created_at ASC -- Keep the oldest one
    ) as rn
  FROM recharge_operators
  WHERE is_active = true
)
UPDATE recharge_operators
SET is_active = false
WHERE id IN (
  SELECT id FROM ranked_operators WHERE rn > 1
);

-- Step 2: Verify no duplicates remain
-- This query should return 0 rows
SELECT 
  operator_name,
  service_type,
  COUNT(*) as count,
  STRING_AGG(operator_code, ', ') as operator_codes
FROM recharge_operators
WHERE is_active = true
GROUP BY operator_name, service_type
HAVING COUNT(*) > 1
ORDER BY service_type, operator_name;

-- Step 3: Show final operator counts by service type
SELECT 
  service_type,
  COUNT(*) as active_operators,
  COUNT(DISTINCT operator_name) as unique_operators
FROM recharge_operators
WHERE is_active = true
GROUP BY service_type
ORDER BY service_type;

-- Step 4: Ensure all active operators have kwikapi_opid
SELECT 
  id,
  operator_name,
  service_type,
  operator_code,
  kwikapi_opid
FROM recharge_operators
WHERE is_active = true AND kwikapi_opid IS NULL
ORDER BY service_type, operator_name;

-- Step 5: Add index for better performance on operator lookups
CREATE INDEX IF NOT EXISTS idx_recharge_operators_active_service 
ON recharge_operators(service_type, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_recharge_operators_kwikapi 
ON recharge_operators(kwikapi_opid) 
WHERE kwikapi_opid IS NOT NULL;

-- Step 6: Add comment to table
COMMENT ON TABLE recharge_operators IS 'Stores all recharge operators with KWIKAPI mapping. Commission/cashback rates are for internal use only and should not be exposed in UI.';

COMMENT ON COLUMN recharge_operators.commission_rate IS 'Commission rate for retailers (internal use only - not shown in UI)';
COMMENT ON COLUMN recharge_operators.cashback_enabled IS 'Whether cashback is enabled for customers (internal use only)';
COMMENT ON COLUMN recharge_operators.cashback_min_percentage IS 'Minimum cashback percentage for customers (internal use only)';
COMMENT ON COLUMN recharge_operators.cashback_max_percentage IS 'Maximum cashback percentage for customers (internal use only)';
