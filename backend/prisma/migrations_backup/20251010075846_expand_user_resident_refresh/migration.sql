/*
  Warnings:

  - Added the required column `residenceStatus` to the `Resident` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RefreshToken" ADD COLUMN     "deviceInfo" JSONB,
ADD COLUMN     "ipAddress" TEXT;

-- AlterTable
ALTER TABLE "Resident" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "education" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "isKkHead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kkNumber" TEXT,
ADD COLUMN     "maritalStatus" TEXT,
ADD COLUMN     "monthlyIncome" DECIMAL(65,30),
ADD COLUMN     "moveInDate" TIMESTAMP(3),
ADD COLUMN     "moveOutDate" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT DEFAULT 'Indonesia',
ADD COLUMN     "occupation" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "religion" TEXT,
ADD COLUMN     "residenceStatus" TEXT;

-- Backfill existing rows with a sensible default where NULL
UPDATE "Resident" SET "residenceStatus" = 'owner' WHERE "residenceStatus" IS NULL;

-- Now make the column NOT NULL
ALTER TABLE "Resident" ALTER COLUMN "residenceStatus" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "emailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "lastLoginIp" TEXT,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "oauthProvider" TEXT,
ADD COLUMN     "oauthProviderId" TEXT,
ADD COLUMN     "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "twoFactorSecret" TEXT,
ALTER COLUMN "isActive" SET DEFAULT false;
