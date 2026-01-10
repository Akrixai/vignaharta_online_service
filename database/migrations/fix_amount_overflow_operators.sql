-- Fix operators with amount overflow issues
-- This migration handles operators where amount_maximum exceeds DECIMAL(10,2) limits

-- First, let's check if there are any operators with problematic amounts
-- and fix them by capping to the maximum allowed value

-- Update any existing operators that might have overflow issues
-- (This is a safety measure in case there are any existing records)
UPDATE kwikapi_billers 
SET amount_maximum = 99999999.99
WHERE amount_maximum > 99999999.99;

-- Update any operators with negative or zero amounts
UPDATE kwikapi_billers 
SET amount_minimum = 1.00
WHERE amount_minimum <= 0;

-- Add a check constraint to prevent future overflow issues
ALTER TABLE kwikapi_billers 
DROP CONSTRAINT IF EXISTS kwikapi_billers_amount_range_check;

ALTER TABLE kwikapi_billers 
ADD CONSTRAINT kwikapi_billers_amount_range_check 
CHECK (
    amount_minimum >= 0 AND 
    amount_minimum <= 99999999.99 AND
    amount_maximum >= 0 AND 
    amount_maximum <= 99999999.99 AND
    amount_maximum >= amount_minimum
);

-- Add comment for documentation
COMMENT ON CONSTRAINT kwikapi_billers_amount_range_check ON kwikapi_billers 
IS 'Ensures amount fields are within valid range and maximum >= minimum';

-- Log the changes
DO $$
DECLARE
    fixed_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO fixed_count 
    FROM kwikapi_billers 
    WHERE amount_maximum = 99999999.99;
    
    RAISE NOTICE 'Fixed % operators with amount overflow issues', fixed_count;
END $$;