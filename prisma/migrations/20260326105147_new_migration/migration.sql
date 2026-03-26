-- CreateTable
CREATE TABLE "Assets" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT,
    "modelName" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "Assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomAssets" (
    "id" INTEGER NOT NULL,
    "roomId" INTEGER NOT NULL,

    CONSTRAINT "RoomAssets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomeAssets" (
    "id" INTEGER NOT NULL,
    "homeId" INTEGER NOT NULL,

    CONSTRAINT "HomeAssets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "RoomAssets" ADD CONSTRAINT "RoomAssets_id_fkey" FOREIGN KEY ("id") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomAssets" ADD CONSTRAINT "RoomAssets_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeAssets" ADD CONSTRAINT "HomeAssets_id_fkey" FOREIGN KEY ("id") REFERENCES "Assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomeAssets" ADD CONSTRAINT "HomeAssets_homeId_fkey" FOREIGN KEY ("homeId") REFERENCES "Home"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
