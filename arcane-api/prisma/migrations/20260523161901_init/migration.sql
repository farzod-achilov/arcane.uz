-- CreateEnum
CREATE TYPE "Rarity" AS ENUM ('COMMON', 'RARE', 'EPIC', 'LEGENDARY');

-- CreateEnum
CREATE TYPE "RewardType" AS ENUM ('GAME', 'COINS', 'BOOST', 'DISCOUNT', 'JACKPOT');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DROP_OPEN', 'REWARD_SELL', 'JACKPOT_WIN', 'ADMIN_GRANT', 'REFERRAL_BONUS', 'STORE_PURCHASE');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('PENDING', 'CLAIMED', 'SOLD');

-- CreateEnum
CREATE TYPE "KeyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'USED', 'DISABLED');

-- CreateEnum
CREATE TYPE "KeyType" AS ENUM ('STORE', 'DROP', 'BOTH');

-- CreateEnum
CREATE TYPE "KeyTransactionType" AS ENUM ('IMPORT', 'PURCHASE', 'DROP_REWARD', 'MANUAL_ASSIGN', 'DISABLE', 'MOVE', 'BULK_IMPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "avatar" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "arcCoins" INTEGER NOT NULL DEFAULT 500,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "banReason" TEXT,
    "totalDrops" INTEGER NOT NULL DEFAULT 0,
    "totalSpent" INTEGER NOT NULL DEFAULT 0,
    "totalWon" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "cover" TEXT,
    "screenshots" TEXT[],
    "description" TEXT,
    "genres" TEXT[],
    "platforms" TEXT[],
    "rating" DOUBLE PRECISION,
    "priceUsd" DOUBLE PRECISION,
    "priceUzs" INTEGER,
    "releaseDate" TIMESTAMP(3),
    "developer" TEXT,
    "publisher" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "stockStore" INTEGER NOT NULL DEFAULT 0,
    "stockDrop" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_keys" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "encryptedKey" TEXT NOT NULL,
    "keyIv" TEXT NOT NULL,
    "keyTag" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "status" "KeyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "type" "KeyType" NOT NULL DEFAULT 'BOTH',
    "reservedFor" TEXT,
    "reservedAt" TIMESTAMP(3),
    "reserveExpiry" TIMESTAMP(3),
    "soldToUserId" TEXT,
    "usedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "key_transactions" (
    "id" TEXT NOT NULL,
    "keyId" TEXT NOT NULL,
    "userId" TEXT,
    "adminId" TEXT,
    "type" "KeyTransactionType" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "key_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_machines" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "theme" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "animConfig" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "totalOpened" INTEGER NOT NULL DEFAULT 0,
    "featuredOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drop_machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_rewards" (
    "id" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "gameId" TEXT,
    "name" TEXT NOT NULL,
    "type" "RewardType" NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "dropChance" DOUBLE PRECISION NOT NULL,
    "sellValue" INTEGER NOT NULL,
    "metadata" JSONB,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "timesDropped" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drop_rewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drop_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dropId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "coinsSpent" INTEGER NOT NULL,
    "jackpotContrib" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drop_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'PENDING',
    "claimedAt" TIMESTAMP(3),
    "soldAt" TIMESTAMP(3),
    "soldFor" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jackpot" (
    "id" TEXT NOT NULL,
    "total" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jackpot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jackpot_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jackpot_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_drops" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" TEXT,
    "rewardName" TEXT NOT NULL,
    "rarity" "Rarity" NOT NULL,
    "dropName" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "live_drops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_username_idx" ON "users"("username");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_refreshToken_key" ON "sessions"("refreshToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "games_slug_key" ON "games"("slug");

-- CreateIndex
CREATE INDEX "games_slug_idx" ON "games"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "games_externalId_source_key" ON "games"("externalId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "game_keys_keyHash_key" ON "game_keys"("keyHash");

-- CreateIndex
CREATE INDEX "game_keys_gameId_status_idx" ON "game_keys"("gameId", "status");

-- CreateIndex
CREATE INDEX "game_keys_gameId_type_status_idx" ON "game_keys"("gameId", "type", "status");

-- CreateIndex
CREATE INDEX "game_keys_keyHash_idx" ON "game_keys"("keyHash");

-- CreateIndex
CREATE INDEX "game_keys_status_idx" ON "game_keys"("status");

-- CreateIndex
CREATE INDEX "game_keys_reserveExpiry_idx" ON "game_keys"("reserveExpiry");

-- CreateIndex
CREATE INDEX "key_transactions_keyId_idx" ON "key_transactions"("keyId");

-- CreateIndex
CREATE INDEX "key_transactions_userId_idx" ON "key_transactions"("userId");

-- CreateIndex
CREATE INDEX "key_transactions_type_idx" ON "key_transactions"("type");

-- CreateIndex
CREATE UNIQUE INDEX "drop_machines_slug_key" ON "drop_machines"("slug");

-- CreateIndex
CREATE INDEX "drop_rewards_dropId_idx" ON "drop_rewards"("dropId");

-- CreateIndex
CREATE INDEX "drop_rewards_rarity_idx" ON "drop_rewards"("rarity");

-- CreateIndex
CREATE INDEX "drop_history_userId_idx" ON "drop_history"("userId");

-- CreateIndex
CREATE INDEX "drop_history_createdAt_idx" ON "drop_history"("createdAt");

-- CreateIndex
CREATE INDEX "inventory_userId_idx" ON "inventory"("userId");

-- CreateIndex
CREATE INDEX "inventory_status_idx" ON "inventory"("status");

-- CreateIndex
CREATE INDEX "transactions_userId_idx" ON "transactions"("userId");

-- CreateIndex
CREATE INDEX "transactions_type_idx" ON "transactions"("type");

-- CreateIndex
CREATE INDEX "jackpot_history_createdAt_idx" ON "jackpot_history"("createdAt");

-- CreateIndex
CREATE INDEX "live_drops_createdAt_idx" ON "live_drops"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_keys" ADD CONSTRAINT "game_keys_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_keys" ADD CONSTRAINT "game_keys_soldToUserId_fkey" FOREIGN KEY ("soldToUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_transactions" ADD CONSTRAINT "key_transactions_keyId_fkey" FOREIGN KEY ("keyId") REFERENCES "game_keys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "key_transactions" ADD CONSTRAINT "key_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_rewards" ADD CONSTRAINT "drop_rewards_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "drop_machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_rewards" ADD CONSTRAINT "drop_rewards_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_history" ADD CONSTRAINT "drop_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drop_history" ADD CONSTRAINT "drop_history_dropId_fkey" FOREIGN KEY ("dropId") REFERENCES "drop_machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "drop_rewards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jackpot_history" ADD CONSTRAINT "jackpot_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_drops" ADD CONSTRAINT "live_drops_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
