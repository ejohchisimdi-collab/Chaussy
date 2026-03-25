/*
  Warnings:

  - A unique constraint covering the columns `[emailCode]` on the table `ConfirmEmail` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[passwordKey]` on the table `PasswordReset` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "loggedInAt" TIMESTAMP(3),
ADD COLUMN     "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Home" (
    "id" SERIAL NOT NULL,
    "yearBuilt" TIMESTAMP(3),
    "userId" INTEGER NOT NULL,

    CONSTRAINT "Home_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfirmEmail_emailCode_key" ON "ConfirmEmail"("emailCode");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordReset_passwordKey_key" ON "PasswordReset"("passwordKey");

-- AddForeignKey
ALTER TABLE "Home" ADD CONSTRAINT "Home_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
