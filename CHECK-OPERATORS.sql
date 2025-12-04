-- Check current operator IDs in database
SELECT 
  id,
  operator_name,
  operator_code,
  kwikapi_opid,
  service_type,
  is_active
FROM recharge_operators 
WHERE service_type = 'PREPAID'
ORDER BY operator_name;

-- This will show you what operators exist and their current kwikapi_opid values
-- The kwikapi_opid should be:
-- Airtel: 1
-- Vodafone Idea (VI): 3
-- BSNL: 4
-- Reliance Jio: 8
-- MTNL: 14
