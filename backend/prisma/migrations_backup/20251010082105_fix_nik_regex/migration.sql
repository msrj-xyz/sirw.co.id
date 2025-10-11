-- Fix residents NIK regex constraint: re-create using [0-9] class
ALTER TABLE "Resident" DROP CONSTRAINT IF EXISTS residents_nik_format;
ALTER TABLE "Resident" ADD CONSTRAINT residents_nik_format CHECK ("nik" ~ '^[0-9]{16}$') NOT VALID;