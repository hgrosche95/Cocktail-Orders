-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "guestName" TEXT NOT NULL,
    "cocktailId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ratings_guestName_cocktailId_key" ON "ratings"("guestName", "cocktailId");
