-- Migration: Update company name from "Vignaharta Janseva" to "Vighnaharta Online Services"
-- This ensures all certificates show the correct company name

-- Update default value for employee_certificates table
ALTER TABLE employee_certificates 
ALTER COLUMN company_name SET DEFAULT 'Vighnaharta Online Services';

-- Update default value for retailer_certificates table
ALTER TABLE retailer_certificates 
ALTER COLUMN company_name SET DEFAULT 'Vighnaharta Online Services';

-- Update any existing records that still have the old name (if any)
UPDATE employee_certificates 
SET company_name = 'Vighnaharta Online Services' 
WHERE company_name = 'Vignaharta Janseva' OR company_name LIKE '%janseva%' OR company_name LIKE '%Janseva%';

UPDATE retailer_certificates 
SET company_name = 'Vighnaharta Online Services' 
WHERE company_name = 'Vignaharta Janseva' OR company_name LIKE '%janseva%' OR company_name LIKE '%Janseva%';

-- Verify the changes
SELECT 'Employee Certificates' as table_name, COUNT(*) as count, company_name 
FROM employee_certificates 
GROUP BY company_name
UNION ALL
SELECT 'Retailer Certificates' as table_name, COUNT(*) as count, company_name 
FROM retailer_certificates 
GROUP BY company_name;
