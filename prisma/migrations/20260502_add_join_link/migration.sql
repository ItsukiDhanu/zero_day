-- AlterTable - add join_link column as nullable first
ALTER TABLE "Team" ADD COLUMN "join_link" VARCHAR(32);

-- Add index for faster lookups
CREATE INDEX "Team_join_link_idx" ON "Team"("join_link");
