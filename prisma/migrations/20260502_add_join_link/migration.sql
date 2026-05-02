-- AlterTable - add join_link column as nullable first
ALTER TABLE "Team" ADD COLUMN "join_link" VARCHAR(32);

-- Keep join_link unique for non-null values while still allowing existing NULL rows.
CREATE UNIQUE INDEX "Team_join_link_key" ON "Team"("join_link");
