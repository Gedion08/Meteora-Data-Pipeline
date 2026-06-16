-- CreateTable
CREATE TABLE "Pool" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "base_token" TEXT NOT NULL,
    "quote_token" TEXT NOT NULL,
    "tvl" DOUBLE PRECISION,
    "current_price" DOUBLE PRECISION,
    "apr" DOUBLE PRECISION,
    "apy" DOUBLE PRECISION,
    "tags" JSONB,
    "source" TEXT NOT NULL,
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pool_address_key" ON "Pool"("address");
