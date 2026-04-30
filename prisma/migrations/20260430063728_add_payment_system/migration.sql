-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "TeamPayment" (
    "id" UUID NOT NULL,
    "team_id" UUID NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT NOT NULL,
    "transaction_reference" TEXT NOT NULL,
    "proof_file_url" TEXT,
    "rejection_reason" TEXT,
    "verified_by_email" TEXT,
    "verified_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_team_id_key" ON "TeamPayment"("team_id");

-- CreateIndex
CREATE INDEX "TeamPayment_status_idx" ON "TeamPayment"("status");

-- CreateIndex
CREATE INDEX "TeamPayment_createdAt_idx" ON "TeamPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "TeamPayment" ADD CONSTRAINT "TeamPayment_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
