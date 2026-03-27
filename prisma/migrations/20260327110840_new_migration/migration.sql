-- CreateTable
CREATE TABLE "Warranties" (
    "id" SERIAL NOT NULL,
    "providerName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "coverageNotes" TEXT,
    "assetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warranties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WarrantyDocuments" (
    "id" SERIAL NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "warrantyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WarrantyDocuments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Warranties" ADD CONSTRAINT "Warranties_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarrantyDocuments" ADD CONSTRAINT "WarrantyDocuments_warrantyId_fkey" FOREIGN KEY ("warrantyId") REFERENCES "Warranties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
