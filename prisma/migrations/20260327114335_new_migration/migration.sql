/*
  Warnings:

  - Added the required column `fileKey` to the `WarrantyDocuments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "WarrantyDocuments" ADD COLUMN     "fileKey" TEXT NOT NULL;
