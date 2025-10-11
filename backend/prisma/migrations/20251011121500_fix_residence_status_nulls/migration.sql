-- Migration: fix_residence_status_nulls
-- Set NULL residenceStatus to 'owner' before changing type

BEGIN;

-- Ensure enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'residencestatus') THEN
    CREATE TYPE "ResidenceStatus" AS ENUM ('owner', 'tenant', 'boarding');
  END IF;
END$$;

-- Update NULLs to default 'owner'
UPDATE "Resident" SET "residenceStatus" = 'owner' WHERE "residenceStatus" IS NULL;

-- Alter column type
ALTER TABLE "Resident" ALTER COLUMN "residenceStatus" TYPE "ResidenceStatus" USING ("residenceStatus"::text::"ResidenceStatus");

COMMIT;
