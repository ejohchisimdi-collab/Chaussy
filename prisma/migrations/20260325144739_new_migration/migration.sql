/*
  Warnings:

  - Added the required column `yearBuilt` to the `Home` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Home" DROP COLUMN "yearBuilt",
ADD COLUMN     "yearBuilt" INTEGER NOT NULL;
