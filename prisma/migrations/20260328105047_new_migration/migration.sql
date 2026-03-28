-- AlterTable
ALTER TABLE "Warranties" ADD COLUMN     "finalNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sevenDayNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "thirtyDayNotification" BOOLEAN NOT NULL DEFAULT false;
