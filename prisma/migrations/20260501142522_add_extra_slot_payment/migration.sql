/*
  Warnings:

  - A unique constraint covering the columns `[team_id,payment_purpose]` on the table `TeamPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('REGISTRATION', 'EXTRA_SLOT');

-- DropIndex
DROP INDEX "TeamPayment_team_id_key";

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "extra_slot_unlocked" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TeamPayment" ADD COLUMN     "payment_purpose" "PaymentPurpose" NOT NULL DEFAULT 'REGISTRATION';

-- CreateIndex
CREATE UNIQUE INDEX "TeamPayment_team_id_payment_purpose_key" ON "TeamPayment"("team_id", "payment_purpose");
