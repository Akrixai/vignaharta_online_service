-- Fix DTH Operator IDs to match KWIKAPI's correct values
-- Run this SQL in your Supabase SQL Editor

-- Fix Airtel DTH Official (should be 7, not 189)
UPDATE recharge_operators 
SET kwikapi_opid = '7' 
WHERE operator_code = 'AIRTEL_DTH_OFFICIAL_189';

-- Fix Dish TV Official (should be 6, not 187)
UPDATE recharge_operators 
SET kwikapi_opid = '6' 
WHERE operator_code = 'DISH_TV_OFFICIAL_187';

-- Fix Sun Direct Official (should be 11, not 186)
UPDATE recharge_operators 
SET kwikapi_opid = '11' 
WHERE operator_code = 'SUN_DIRECT_OFFICIAL_186';

-- Fix Tata Sky Official (should be 5, not 185)
UPDATE recharge_operators 
SET kwikapi_opid = '5' 
WHERE operator_code = 'TATA_SKY_OFFICIAL_185';

-- Fix Videocon D2h Official (should be 28, not 188)
UPDATE recharge_operators 
SET kwikapi_opid = '28' 
WHERE operator_code = 'VIDEOCON_D2H_OFFICIAL_188';

-- Verify the changes
SELECT 
  operator_name, 
  operator_code, 
  kwikapi_opid, 
  is_active 
FROM recharge_operators 
WHERE service_type = 'DTH' AND is_active = true
ORDER BY operator_name;

-- Expected results after fix:
-- Airtel DTH Official: 7
-- Dish TV Official: 6
-- Sun Direct Official: 11
-- Tata Sky Official: 5
-- Videocon D2h Official: 28
