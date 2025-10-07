-- Reset orders table to fix FK constraint
-- This will drop the table and let TypeORM recreate it with correct schema

DROP TABLE IF EXISTS "orders" CASCADE;

-- The table will be recreated automatically by TypeORM synchronize: true
-- with the correct foreign key pointing to folders.url
