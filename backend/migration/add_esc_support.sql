-- Migration script to add support for ESC (Energy Storage Cabinet) data to an EXISTING database.
-- This script is idempotent and can be run safely multiple times.

BEGIN;

-- 1. Extend the 'metrics' table

-- Add 'source' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metrics' AND column_name='source') THEN
        ALTER TABLE metrics ADD COLUMN source VARCHAR(255) DEFAULT 'air-dome';
    END IF;
END$$;

-- Add 'channel' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metrics' AND column_name='channel') THEN
        ALTER TABLE metrics ADD COLUMN channel INTEGER;
    END IF;
END$$;

-- Add 'data_type' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='metrics' AND column_name='data_type') THEN
        ALTER TABLE metrics ADD COLUMN data_type VARCHAR(50);
    END IF;
END$$;

-- Update existing rows to set the source
UPDATE metrics SET source = 'air-dome' WHERE source IS NULL;


-- 2. Create the 'settings' table if it doesn't exist

CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
);

-- Insert the initial setting, doing nothing if it already exists.
INSERT INTO settings (key, value) VALUES ('show_esc_module', 'true') ON CONFLICT (key) DO NOTHING;


COMMIT;
