/*
  Warnings:

  - You are about to drop the column `warrantyStatus` on the `WarrantyDocuments` table. All the data in the column will be lost.
  - Added the required column `warrantyStatus` to the `Warranties` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Warranties" ADD COLUMN     "warrantyStatus" "WarrantyStatus" NOT NULL;

-- AlterTable
ALTER TABLE "WarrantyDocuments" DROP COLUMN "warrantyStatus";
