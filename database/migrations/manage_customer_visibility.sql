-- Manage Customer Visibility for Services and Products
-- This script helps you control which services and products are visible to customers

-- ============================================
-- SERVICES VISIBILITY MANAGEMENT
-- ============================================

-- Example: Hide specific services from customers (machines, business services, etc.)
-- Uncomment and modify as needed:

-- Hide business/retailer-only services from customers
UPDATE schemes 
SET show_to_customer = false
WHERE name IN (
  'BUSINESS LOAN',
  'DIE CUTTER MACHINE',
  'A4 PAPER CUTTER MACHINE',
  'SPIRAL BINDING MACHINE KENT',
  'SPIRAL BINDING MACHINE EXCLAM',
  'A3 LAMINATOR MACHINE'
);

-- Show only basic government services to customers
-- UPDATE schemes 
-- SET show_to_customer = true
-- WHERE category IN ('Identity Documents', 'Travel Documents', 'Government Schemes');

-- ============================================
-- PRODUCTS VISIBILITY MANAGEMENT
-- ============================================

-- Example: Hide retailer equipment from customers
UPDATE products
SET show_to_customer = false
WHERE name LIKE '%MACHINE%' OR name LIKE '%EQUIPMENT%';

-- Show only customer-facing products
-- UPDATE products
-- SET show_to_customer = true
-- WHERE category IN ('Digital Services', 'Photo Services', 'Document Services', 'Printing Services');

-- ============================================
-- VERIFY CHANGES
-- ============================================

-- Check services visible to customers
SELECT id, name, category, price, show_to_customer, cashback_enabled
FROM schemes
WHERE is_active = true
ORDER BY show_to_customer DESC, name;

-- Check products visible to customers
SELECT id, name, category, price, show_to_customer, stock_quantity
FROM products
WHERE is_active = true
ORDER BY show_to_customer DESC, name;

-- ============================================
-- CUSTOMER-SPECIFIC PRICING
-- ============================================

-- Set special customer prices (optional)
-- UPDATE schemes
-- SET customer_price = price * 0.9  -- 10% discount for customers
-- WHERE show_to_customer = true AND customer_price IS NULL;

-- UPDATE products
-- SET customer_price = price * 0.95  -- 5% discount for customers
-- WHERE show_to_customer = true AND customer_price IS NULL;
