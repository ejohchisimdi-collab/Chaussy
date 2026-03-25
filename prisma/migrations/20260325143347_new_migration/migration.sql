/*
  Warnings:

  - Added the required column `propertyType` to the `Home` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('BUNGALOW', 'DUPLEX', 'MANSION', 'APARTMENT');

-- AlterTable
ALTER TABLE "Home" ADD COLUMN     "address" TEXT,
ADD COLUMN     "profileKey" TEXT,
ADD COLUMN     "propertyType" "PropertyType" NOT NULL;

-- CreateTable
CREATE TABLE "Room" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "roomSize" INTEGER,
    "floorLevel" INTEGER,
    "homeId" INTEGER NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
