-- Adjust orders.folderId type to varchar and recreate FK to folders.url
BEGIN;

-- 1) Ensure the column type is varchar (string)
ALTER TABLE "orders"
  ALTER COLUMN "folderId" TYPE varchar USING "folderId"::varchar;

-- 2) Drop old FK if exists (name from error or previous sync)
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_c7f60d38ca80c85bb1b6db20784";
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "FK_orders_folderId_folders_id";

-- 3) Create new FK referencing folders.url with cascade delete
ALTER TABLE "orders"
  ADD CONSTRAINT "FK_orders_folderId_folders_url"
  FOREIGN KEY ("folderId") REFERENCES "folders"("url") ON DELETE CASCADE;

COMMIT;


