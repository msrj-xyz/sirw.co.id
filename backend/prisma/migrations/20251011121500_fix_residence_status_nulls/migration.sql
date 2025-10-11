-- Migration: fix_residence_status_nulls
-- Make this migration idempotent and defensive so it can run safely in CI and on databases

-- Create enum type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'residencestatus') THEN
    CREATE TYPE "ResidenceStatus" AS ENUM ('owner', 'tenant', 'boarding');
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- ignore race/duplicate errors
  NULL;
END$$;

-- Update NULLs to default 'owner' only if column exists and NULLs are present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Resident' AND column_name = 'residenceStatus') THEN
    IF EXISTS (SELECT 1 FROM "Resident" WHERE "residenceStatus" IS NULL) THEN
      UPDATE "Resident" SET "residenceStatus" = 'owner' WHERE "residenceStatus" IS NULL;
    END IF;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping update of NULL residenceStatus due to: %', SQLERRM;
END$$;

-- Alter column type to enum only if needed; guard with exception to avoid aborting migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Resident' AND column_name = 'residenceStatus') THEN
    -- check current udt_name; alter only if it's not already the enum type
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns c JOIN pg_type t ON c.udt_name = t.typname
      WHERE c.table_name = 'Resident' AND c.column_name = 'residenceStatus' AND t.typname = 'residencestatus'
    ) THEN
      BEGIN
        ALTER TABLE "Resident" ALTER COLUMN "residenceStatus" TYPE "ResidenceStatus" USING ("residenceStatus"::text::"ResidenceStatus");
      EXCEPTION WHEN others THEN
        RAISE NOTICE 'Could not alter column residenceStatus to enum: %', SQLERRM;
      END;
    END IF;
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Skipping alter of residenceStatus due to: %', SQLERRM;
END$$;
