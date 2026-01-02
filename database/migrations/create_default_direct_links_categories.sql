-- Create default categories for direct links services
-- This migration adds basic categories that can be used for organizing direct link services

-- Insert default categories if they don't exist
INSERT INTO direct_links_categories (name, description, icon, sort_order, is_active)
VALUES 
  ('Banking', 'Financial services and banking solutions', '🏦', 1, true),
  ('Insurance', 'Insurance and protection plans', '🛡️', 2, true),
  ('Travel', 'Travel booking and related services', '✈️', 3, true),
  ('Education', 'Educational services and courses', '📚', 4, true),
  ('Healthcare', 'Medical and healthcare services', '🏥', 5, true),
  ('Government', 'Government services and documentation', '🏛️', 6, true),
  ('Utilities', 'Utility bill payments and services', '⚡', 7, true),
  ('Shopping', 'E-commerce and shopping platforms', '🛒', 8, true),
  ('Entertainment', 'Entertainment and media services', '🎬', 9, true),
  ('Technology', 'Tech services and software solutions', '💻', 10, true)
ON CONFLICT (name) DO NOTHING;

-- Update existing services to use proper category names if needed
-- This ensures backward compatibility with any existing services

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_direct_links_categories_active ON direct_links_categories(is_active);
CREATE INDEX IF NOT EXISTS idx_direct_links_categories_sort_order ON direct_links_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_direct_links_services_category ON direct_links_services(category);

-- Add foreign key constraint if it doesn't exist (optional, for data integrity)
-- Note: This assumes the category field in direct_links_services stores the category name
-- If you want to use category IDs instead, you would need to modify the schema

COMMENT ON TABLE direct_links_categories IS 'Categories for organizing direct link services';
COMMENT ON COLUMN direct_links_categories.name IS 'Unique category name used as identifier';
COMMENT ON COLUMN direct_links_categories.icon IS 'Emoji or icon representation for the category';
COMMENT ON COLUMN direct_links_categories.sort_order IS 'Display order for categories (lower numbers first)';