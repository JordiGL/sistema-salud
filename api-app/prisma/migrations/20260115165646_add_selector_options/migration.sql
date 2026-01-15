-- CreateTable
CREATE TABLE "ContextOption" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContextOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationOption" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContextOption_key_key" ON "ContextOption"("key");

-- CreateIndex
CREATE UNIQUE INDEX "LocationOption_key_key" ON "LocationOption"("key");
