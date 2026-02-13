-- CreateTable
CREATE TABLE "health_events" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL DEFAULT 'CHEMOTHERAPY',
    "notes" TEXT,
    "severity" TEXT,
    "medication" TEXT,

    CONSTRAINT "health_events_pkey" PRIMARY KEY ("id")
);
