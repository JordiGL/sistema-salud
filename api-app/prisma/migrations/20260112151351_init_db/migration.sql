-- CreateTable
CREATE TABLE "health_metrics" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "systolic" INTEGER,
    "diastolic" INTEGER,
    "pulse" INTEGER,
    "spo2" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "ca125" DOUBLE PRECISION,

    CONSTRAINT "health_metrics_pkey" PRIMARY KEY ("id")
);
