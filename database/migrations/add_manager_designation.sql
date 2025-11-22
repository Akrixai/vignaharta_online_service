-- ============================================
-- Migration: Add MANAGER and DISTRIBUTOR to designation constraint
-- Date: 2024-01-20
-- Description: Update users table designation constraint to include MANAGER and DISTRIBUTOR
-- ============================================

-- INSTRUCTIONS:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire script
-- 4. Click "Run" to execute

-- ============================================
-- Step 1: Drop the existing constraint
-- ============================================
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_designation_check;

-- ============================================
-- Step 2: Add new constraint with MANAGER and DISTRIBUTOR included
-- ============================================
ALTER TABLE users ADD CONSTRAINT users_designation_check 
CHECK (designation::text = ANY (ARRAY[
    'MANAGER'::character varying,
    'STATE_MANAGER'::character varying,
    'DISTRICT_MANAGER'::character varying,
    'SUPERVISOR'::character varying,
    'DISTRIBUTOR'::character varying,
    'EMPLOYEE'::character varying,
    'RETAILER'::character varying
]::text[]));

-- ============================================
-- Step 3: Verify the constraint was created successfully
-- ============================================
SELECT 
    constraint_name, 
    check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_designation_check';

-- ============================================
-- Expected Result:
-- constraint_name: users_designation_check
-- check_clause: ((designation)::text = ANY ((ARRAY['MANAGER'::character varying, 'STATE_MANAGER'::character varying, ...])::text[]))
-- ============================================

-- ============================================
-- Hierarchy Structure After Migration:
-- ADMIN (role)
--   └── MANAGER (designation)
--       └── STATE_MANAGER (designation)
--           └── DISTRICT_MANAGER (designation)
--               ├── SUPERVISOR (designation)
--               │   ├── EMPLOYEE (designation)
--               │   │   └── RETAILER (designation)
--               │   └── RETAILER (designation)
--               └── DISTRIBUTOR (designation)
--                   ├── EMPLOYEE (designation)
--                   │   └── RETAILER (designation)
--                   └── RETAILER (designation)
-- ============================================
