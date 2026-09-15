-- CreateTable
CREATE TABLE "orders" (
    "orderId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "note" TEXT,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("orderId")
);

-- CreateTable
CREATE TABLE "unavailable_ingredients" (
    "ingredient" TEXT NOT NULL,

    CONSTRAINT "unavailable_ingredients_pkey" PRIMARY KEY ("ingredient")
);
