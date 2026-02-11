-- CreateTable
CREATE TABLE "DailyBriefing" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status_ca" TEXT NOT NULL,
    "trend_ca" TEXT NOT NULL,
    "status_es" TEXT NOT NULL,
    "trend_es" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyBriefing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyBriefing_date_key" ON "DailyBriefing"("date");