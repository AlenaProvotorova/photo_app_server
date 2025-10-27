-- Add firstSettingsAlert column to folder_settings table
BEGIN;

-- Add the firstSettingsAlert column with default value false
ALTER TABLE "folder_settings" 
ADD COLUMN IF NOT EXISTS "firstSettingsAlert" boolean DEFAULT false;

COMMIT;

