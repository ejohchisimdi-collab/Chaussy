/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `user` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "passwordReset" (
    "id" SERIAL NOT NULL,
    "passwordKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "passwordReset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
