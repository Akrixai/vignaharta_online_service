-- Add geolocation columns to pan_services table for security and compliance
-- This migration adds location tracking for PAN service applications

-- Add geolocation columns to pan_services table
ALTER TABLE pan_services 
ADD COLUMN IF NOT EXISTS geolocation_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS geolocation_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS geolocation_accuracy DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS geolocation_timestamp TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN pan_services.geolocation_latitude IS 'Latitude coordinate where the PAN application was initiated (for security and compliance)';
COMMENT ON COLUMN pan_services.geolocation_longitude IS 'Longitude coordinate where the PAN application was initiated (for security and compliance)';
COMMENT ON COLUMN pan_services.geolocation_accuracy IS 'GPS accuracy in meters when the location was captured';
COMMENT ON COLUMN pan_services.geolocation_timestamp IS 'Timestamp when the geolocation was captured on the client device';

-- Create index for geolocation queries (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_pan_services_geolocation 
ON pan_services (geolocation_latitude, geolocation_longitude) 
WHERE geolocation_latitude IS NOT NULL AND geolocation_longitude IS NOT NULL;

-- Create index for geolocation timestamp
CREATE INDEX IF NOT EXISTS idx_pan_services_geolocation_timestamp 
ON pan_services (geolocation_timestamp) 
WHERE geolocation_timestamp IS NOT NULL;

-- Add a function to calculate distance between two points (for analytics)
CREATE OR REPLACE FUNCTION calculate_distance_km