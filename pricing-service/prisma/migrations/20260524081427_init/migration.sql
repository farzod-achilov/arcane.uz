-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('percent', 'fixed');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'UZS', 'EUR', 'RUB');

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "supplierPrice" DECIMAL(12,4) NOT NULL,
    "markupType" "MarkupType" NOT NULL,
    "markupValue" DECIMAL(12,4) NOT NULL,
    "finalPrice" DECIMAL(12,4) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minPrice" DECIMAL(12,4),
    "maxPrice" DECIMAL(12,4),
    "markupType" "MarkupType" NOT NULL,
    "markupValue" DECIMAL(12,4) NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_config" (
    "id" TEXT NOT NULL,
    "globalMarkupPercent" DECIMAL(8,4) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offers_gameId_idx" ON "offers"("gameId");

-- CreateIndex
CREATE INDEX "offers_supplierId_idx" ON "offers"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_slug_key" ON "suppliers"("slug");

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
