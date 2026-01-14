/*
  Warnings:

  - You are about to drop the column `diastolic` on the `health_metrics` table. All the data in the column will be lost.
  - You are about to drop the column `systolic` on the `health_metrics` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "health_metrics" DROP COLUMN "diastolic",
DROP COLUMN "systolic",
ADD COLUMN     "bloodPressure" TEXT,
ADD COLUMN     "measurementContext" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "weightLocation" TEXT;
