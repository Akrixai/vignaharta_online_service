-- Check DTH operators in database
SELECT 
  id,
  operator_name,
  operator_code,
  kwikapi_opid,
  service_type,
  is_active
FROM recharge_operators 
WHERE service_type = 'DTH'
ORDER BY operator_name;

-- Common DTH Operator IDs from KWIKAPI:
-- Airtel Digital TV: 7
-- Dish TV: 6
-- Sun Direct: 11
-- Tata Sky: 5
-- Videocon D2H: 28
