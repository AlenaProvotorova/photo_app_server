-- Add isSuperUser column to users table
BEGIN;

-- Add the isSuperUser column with default value false
ALTER TABLE "user_entity" 
ADD COLUMN IF NOT EXISTS "isSuperUser" boolean DEFAULT false;

COMMIT;
