/*
  Warnings:

  - The `gender` column on the `Resident` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `nationality` on table `Resident` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `residenceStatus` on the `Resident` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "ResidenceStatus" AS ENUM ('owner', 'tenant', 'boarding');

-- AlterTable
ALTER TABLE "Resident" DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
ALTER COLUMN "nationality" SET NOT NULL,
DROP COLUMN "residenceStatus",
ADD COLUMN     "residenceStatus" "ResidenceStatus" NOT NULL;

-- CreateIndex
CREATE INDEX "idx_residents_rt_rw" ON "Resident"("rtNumber", "rwNumber");

-- CreateIndex
CREATE INDEX "idx_residents_full_name" ON "Resident"("fullName");

-- CreateIndex
-- Use IF NOT EXISTS and keep same filtered index to avoid duplicate-name errors
CREATE INDEX IF NOT EXISTS "idx_residents_is_active" ON "Resident"("isActive") WHERE "deletedAt" IS NULL;
