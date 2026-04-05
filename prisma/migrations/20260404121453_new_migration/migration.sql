-- CreateTable
CREATE TABLE "RequestPremium" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "timesRequested" INTEGER NOT NULL,

    CONSTRAINT "RequestPremium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestPremium_userId_key" ON "RequestPremium"("userId");

-- AddForeignKey
ALTER TABLE "RequestPremium" ADD CONSTRAINT "RequestPremium_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
