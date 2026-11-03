-- CreateTable
CREATE TABLE "custom_cocktails" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_cocktails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_cocktails_name_key" ON "custom_cocktails"("name");

-- IDs unter 1000 gehoeren der Grundkarte (shared/cocktails.json).
ALTER SEQUENCE "custom_cocktails_id_seq" RESTART WITH 1001;
