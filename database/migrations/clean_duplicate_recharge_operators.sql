-- Clean Duplicate Recharge Operators and Update Names
-- This migration removes duplicate operators and ensures clean operator list

-- Step 1: Disable duplicate operators (keep the first one of each duplicate)

-- POSTPAID: Keep only one Airtel Postpaid
UPDATE recharge_operators 
SET is_active = false 
WHERE operator_code = 'AIRTEL_POST_48' AND service_type = 'POSTPAID';

-- DTH: Keep only one AIRTEL DTH (remove VIDEOCON duplicate)
UPDATE recharge_operators 
SET is_active = false 
WHERE operator_code = 'VIDEOCON' AND service_type = 'DTH';

-- ELECTRICITY: Remove duplicates
UPDATE recharge_operators 
SET is_active = false 
WHERE operator_code IN ('BESCOM_78', 'GOA_ELECTRICITY_DEPARTMENT_230', 'MSEDCL_76', 'TNEB_79') 
AND service_type = 'ELECTRICITY';

-- Step 2: Update operator names to match requirements

-- PREPAID Mobile Operators
UPDATE recharge_operators SET operator_name = 'Airtel Prepaid' WHERE kwikapi_opid = 1 AND service_type = 'PREPAID';
UPDATE recharge_operators SET operator_name = 'BSNL Prepaid' WHERE kwikapi_opid IN (4, 5) AND service_type = 'PREPAID';
UPDATE recharge_operators SET operator_name = 'Jio Prepaid' WHERE kwikapi_opid = 8 AND service_type = 'PREPAID';
UPDATE recharge_operators SET operator_name = 'MTNL Prepaid' WHERE kwikapi_opid IN (14, 15) AND service_type = 'PREPAID';
UPDATE recharge_operators SET operator_name = 'IDEA Prepaid' WHERE kwikapi_opid = 3 AND service_type = 'PREPAID' AND operator_name LIKE '%IDEA%';
UPDATE recharge_operators SET operator_name = 'Vi Prepaid' WHERE kwikapi_opid = 21 AND service_type = 'PREPAID';

-- POSTPAID Mobile Operators
UPDATE recharge_operators SET operator_name = 'Airtel Postpaid Mobile' WHERE kwikapi_opid = 48 AND service_type = 'POSTPAID' AND is_active = true;
UPDATE recharge_operators SET operator_name = 'BSNL Postpaid Mobile' WHERE kwikapi_opid = 36 AND service_type = 'POSTPAID';
UPDATE recharge_operators SET operator_name = 'JIO Postpaid Mobile' WHERE kwikapi_opid IN (8, 181) AND service_type = 'POSTPAID';
UPDATE recharge_operators SET operator_name = 'MTNL DELHI – DOLPHIN' WHERE kwikapi_opid = 14 AND service_type = 'POSTPAID' AND operator_code LIKE '%DELHI%';
UPDATE recharge_operators SET operator_name = 'MTNL DOLPHIN – Mumbai Postpaid Mobile' WHERE kwikapi_opid = 14 AND service_type = 'POSTPAID' AND operator_code LIKE '%MUMBAI%';
UPDATE recharge_operators SET operator_name = 'Vi Postpaid Mobile' WHERE kwikapi_opid = 29 AND service_type = 'POSTPAID';

-- DTH Operators
UPDATE recharge_operators SET operator_name = 'Airtel Digital TV' WHERE kwikapi_opid = 23 AND service_type = 'DTH' AND is_active = true;
UPDATE recharge_operators SET operator_name = 'Dish TV' WHERE kwikapi_opid IN (6, 25) AND service_type = 'DTH' AND operator_name LIKE '%DISH%';
UPDATE recharge_operators SET operator_name = 'Sun Direct' WHERE kwikapi_opid IN (11, 22, 26) AND service_type = 'DTH';
UPDATE recharge_operators SET operator_name = 'Tata Play (Formerly Tatasky)' WHERE kwikapi_opid IN (20, 27) AND service_type = 'DTH' AND operator_name LIKE '%TATA%';
UPDATE recharge_operators SET operator_name = 'D2H Videocon' WHERE kwikapi_opid = 28 AND service_type = 'DTH';

-- Step 3: Deactivate operators NOT in the required list

-- PREPAID: Keep only Airtel, BSNL, Jio, MTNL, IDEA, Vi
UPDATE recharge_operators 
SET is_active = false 
WHERE service_type = 'PREPAID' 
AND kwikapi_opid NOT IN (1, 3, 4, 5, 8, 14, 15, 21, 177, 178, 179, 180, 181, 182, 183);

-- POSTPAID: Keep only specified operators
UPDATE recharge_operators 
SET is_active = false 
WHERE service_type = 'POSTPAID' 
AND operator_name NOT IN (
  'Airtel Postpaid Mobile',
  'BSNL Postpaid Mobile',
  'JIO Postpaid Mobile',
  'MTNL DELHI – DOLPHIN',
  'MTNL DOLPHIN – Mumbai Postpaid Mobile',
  'Vi Postpaid Mobile'
);

-- DTH: Keep only specified operators
UPDATE recharge_operators 
SET is_active = false 
WHERE service_type = 'DTH' 
AND operator_name NOT IN (
  'Airtel Digital TV',
  'Dish TV',
  'Sun Direct',
  'Tata Play (Formerly Tatasky)',
  'Zing TV (Dish TV)',
  'D2H Videocon'
);

-- Step 4: Verify no duplicates remain
-- This query should return 0 rows
SELECT 
  service_type,
  operator_name,
  COUNT(*) as count
FROM recharge_operators
WHERE is_active = true
GROUP BY service_type, operator_name
HAVING COUNT(*) > 1;

-- Step 5: Show final operator counts
SELECT 
  service_type,
  COUNT(*) as active_operators
FROM recharge_operators
WHERE is_active = true
GROUP BY service_type
ORDER BY service_type;
