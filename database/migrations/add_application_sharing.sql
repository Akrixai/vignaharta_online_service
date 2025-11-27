-- Migration: Add application sharing functionality
-- This allows admin/employees to share approved applications publicly

-- Add sharing columns to applications table if they don't exist
DO $$ 
BEGIN
    -- Add share_token column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_token') THEN
        ALTER TABLE applications ADD COLUMN share_token VARCHAR(255) UNIQUE;
    END IF;

    -- Add share_enabled column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_enabled') THEN
        ALTER TABLE applications ADD COLUMN share_enabled BOOLEAN DEFAULT false;
    END IF;

    -- Add share_created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_created_at') THEN
        ALTER TABLE applications ADD COLUMN share_created_at TIMESTAMPTZ;
    END IF;

    -- Add share_created_by column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_created_by') THEN
        ALTER TABLE applications ADD COLUMN share_created_by UUID REFERENCES users(id);
    END IF;

    -- Add share_expires_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_expires_at') THEN
        ALTER TABLE applications ADD COLUMN share_expires_at TIMESTAMPTZ;
    END IF;

    -- Add share_view_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'applications' AND column_name = 'share_view_count') THEN
        ALTER TABLE applications ADD COLUMN share_view_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create index on share_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_applications_share_token ON applications(share_token) WHERE share_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN applications.share_token IS 'Unique token for publicly sharing application details';
COMMENT ON COLUMN applications.share_enabled IS 'Whether this application can be accessed via public share link';
COMMENT ON COLUMN applications.share_created_at IS 'When the share link was created';
COMMENT ON COLUMN applications.share_created_by IS 'Admin/Employee who created the share link';
COMMENT ON COLUMN applications.share_expires_at IS 'When the share link expires (optional)';
COMMENT ON COLUMN applications.share_view_count IS 'Number of times the shared application has been viewed';
