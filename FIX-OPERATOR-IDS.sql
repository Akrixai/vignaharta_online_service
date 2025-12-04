-- Fix KWIKAPI Operator IDs in Database
-- Run this SQL in your Supabase SQL Editor

-- Update operator IDs to match KWIKAPI's correct opid values
UPDATE recharge_operators 
SET kwikapi_opid = '1' 
WHERE operator_code = 'AIRTEL' AND service_type = 'PREPAID';

UPDATE recharge_operators 
SET kwikapi_opid = '3' 
WHERE operator_code = 'VI' AND service_type = 'PREPAID';

UPDATE recharge_operators 
SET kwikapi_opid = '8' 
WHERE operator_code = 'JIO' AND service_type = 'PREPAID';

UPDATE recharge_operators 
SET kwikapi_opid = '4' 
WHERE operator_code = 'BSNL' AND service_type = 'PREPAID';

UPDATE recharge_operators 
SET kwikapi_opid = '14' 
WHERE operator_code = 'MTNL' AND service_type = 'PREPAID';

-- Verify the changes
SELECT id, operator_name, operator_code, kwikapi_opid, service_type 
FROM recharge_operators 
WHERE service_type = 'PREPAID'
ORDER BY operator_name;
