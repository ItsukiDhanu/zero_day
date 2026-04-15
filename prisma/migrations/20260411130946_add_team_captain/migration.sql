-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "captain_id" UUID;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_captain_id_fkey" FOREIGN KEY ("captain_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
