-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password_reset_expires_at" TIMESTAMP(3),
ADD COLUMN     "password_reset_token_hash" CHAR(64);

-- CreateIndex
CREATE INDEX "User_password_reset_token_hash_idx" ON "User"("password_reset_token_hash");
