/*
  Warnings:

  - Added the required column `expiresAt` to the `ConfirmEmail` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `PasswordReset` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConfirmEmail" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PasswordReset" ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL;
