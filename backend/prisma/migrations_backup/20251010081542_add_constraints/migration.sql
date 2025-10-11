-- Add CHECK constraints and partial indexes per DB design document

-- Users: require either email or phone
ALTER TABLE "User" ADD CONSTRAINT users_email_or_phone_required CHECK ("email" IS NOT NULL OR "phone" IS NOT NULL) NOT VALID;

-- Users: role constraint
ALTER TABLE "User" ADD CONSTRAINT users_role_valid CHECK ("role" IN ('super_admin', 'admin_rw', 'admin_rt', 'bendahara', 'warga', 'satpam')) NOT VALID;

-- Residents: NIK format (16 digits)
ALTER TABLE "Resident" ADD CONSTRAINT residents_nik_format CHECK ("nik" ~ '^\\\d{16}$') NOT VALID;

-- Residents: gender enum
ALTER TABLE "Resident" ADD CONSTRAINT residents_gender_valid CHECK ("gender" IS NULL OR "gender" IN ('M', 'F')) NOT VALID;

-- Residents: residence status enum
ALTER TABLE "Resident" ADD CONSTRAINT residents_residence_status_valid CHECK ("residenceStatus" IN ('owner', 'tenant', 'boarding')) NOT VALID;

-- Partial indexes (WHERE deletedAt IS NULL)
CREATE INDEX IF NOT EXISTS idx_users_email_active ON "User"("email") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_phone_active ON "User"("phone") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_role_active ON "User"("role") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_users_is_active ON "User"("isActive") WHERE "deletedAt" IS NULL;

CREATE INDEX IF NOT EXISTS idx_residents_nik_active ON "Resident"("nik") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_kk_number_active ON "Resident"("kkNumber") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_rt_rw_active ON "Resident"("rtNumber", "rwNumber") WHERE "deletedAt" IS NULL;
CREATE INDEX IF NOT EXISTS idx_residents_full_name ON "Resident"("fullName");
CREATE INDEX IF NOT EXISTS idx_residents_is_active ON "Resident"("isActive") WHERE "deletedAt" IS NULL;

-- Refresh tokens indexes
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON "RefreshToken"("expiresAt");
