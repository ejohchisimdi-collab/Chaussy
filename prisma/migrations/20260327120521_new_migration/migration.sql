/*
  Warnings:

  - Added the required column `warrantyStatus` to the `WarrantyDocuments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');

-- AlterTable
ALTER TABLE "WarrantyDocuments" ADD COLUMN     "warrantyStatus" "WarrantyStatus" NOT NULL;
