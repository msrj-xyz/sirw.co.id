-- Migration: add_residence_status_enum
-- Create enum type and alter column safely if possible

DO $$
BEGIN
  -- Create enum type if not exists
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'residencestatus') THEN
    CREATE TYPE "ResidenceStatus" AS ENUM ('owner', 'tenant', 'boarding');
  END IF;
EXCEPTION WHEN duplicate_object THEN
  -- ignore
END$$;

-- Only attempt to alter column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Resident' AND column_name = 'residenceStatus') THEN
    ALTER TABLE "Resident" ALTER COLUMN "residenceStatus" TYPE "ResidenceStatus" USING ("residenceStatus"::text::"ResidenceStatus");
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Could not alter column residenceStatus to enum; please inspect and migrate manually.';
END$$;
