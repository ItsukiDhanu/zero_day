-- AlterTable
ALTER TABLE "Team" ADD COLUMN "join_link" VARCHAR(32) NOT NULL DEFAULT '';

-- CreateIndex to make join_link unique
CREATE UNIQUE INDEX "Team_join_link_key" ON "Team"("join_link");

-- CreateIndex for lookups
CREATE INDEX "Team_join_link_idx" ON "Team"("join_link");
