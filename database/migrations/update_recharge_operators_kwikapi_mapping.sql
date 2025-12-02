-- Add KWIKAPI operator ID mapping to recharge_operators table
-- This allows mapping between our operator codes and KWIKAPI's opid

-- Add kwikapi_opid column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'recharge_operators' 
        AND column_name = 'kwikapi_opid'
    ) THEN
        ALTER TABLE recharge_operators 
        ADD COLUMN kwikapi_opid INTEGER;
        
        -- Create index for faster lookups
        CREATE INDEX idx_recharge_operators_kwikapi_opid 
        ON recharge_operators(kwikapi_opid);
    END IF;
END $$;

-- Update existing operators with KWIKAPI opid mappings
-- These are example mappings - you need to get actual opid values from KWIKAPI
-- Use the operatorFetch.php API to get the correct opid for each operator

-- Example updates (replace with actual KWIKAPI opid values):
UPDATE recharge_operators SET kwikapi_opid = 1 WHERE operator_code = 'AIRTEL' AND service_type = 'PREPAID';
UPDATE recharge_operators SET kwikapi_opid = 2 WHERE operator_code = 'VI' AND service_type = 'PREPAID';
UPDATE recharge_operators SET kwikapi_opid = 3 WHERE operator_code = 'JIO' AND service_type = 'PREPAID';
UPDATE recharge_operators SET kwikapi_opid = 4 WHERE operator_code = 'BSNL' AND service_type = 'PREPAID';

UPDATE recharge_operators SET kwikapi_opid = 10 WHERE operator_code = 'AIRTEL_POST' AND service_type = 'POSTPAID';
UPDATE recharge_operators SET kwikapi_opid = 11 WHERE operator_code = 'VI_POST' AND service_type = 'POSTPAID';
UPDATE recharge_operators SET kwikapi_opid = 12 WHERE operator_code = 'JIO_POST' AND service_type = 'POSTPAID';

UPDATE recharge_operators SET kwikapi_opid = 20 WHERE operator_code = 'TATASKY' AND service_type = 'DTH';
UPDATE recharge_operators SET kwikapi_opid = 21 WHERE operator_code = 'DISHD2H' AND service_type = 'DTH';
UPDATE recharge_operators SET kwikapi_opid = 22 WHERE operator_code = 'SUNTV' AND service_type = 'DTH';
UPDATE recharge_operators SET kwikapi_opid = 23 WHERE operator_code = 'VIDEOCON' AND service_type = 'DTH';
UPDATE recharge_operators SET kwikapi_opid = 24 WHERE operator_code = 'BIGTV' AND service_type = 'DTH';

UPDATE recharge_operators SET kwikapi_opid = 53 WHERE operator_code = 'MSEDCL' AND service_type = 'ELECTRICITY';
UPDATE recharge_operators SET kwikapi_opid = 54 WHERE operator_code = 'BESCOM' AND service_type = 'ELECTRICITY';
UPDATE recharge_operators SET kwikapi_opid = 55 WHERE operator_code = 'TNEB' AND service_type = 'ELECTRICITY';
UPDATE recharge_operators SET kwikapi_opid = 56 WHERE operator_code = 'WESCO' AND service_type = 'ELECTRICITY';
UPDATE recharge_operators SET kwikapi_opid = 57 WHERE operator_code = 'KPTCL' AND service_type = 'ELECTRICITY';
UPDATE recharge_operators SET kwikapi_opid = 58 WHERE operator_code = 'APCPDCL' AND service_type = 'ELECTRICITY';

-- Add comment
COMMENT ON COLUMN recharge_operators.kwikapi_opid IS 'KWIKAPI operator ID (opid) for API calls';

COMMIT;
