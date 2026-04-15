/*
  Warnings:

  - You are about to drop the column `dietaryRestrictions` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `githubHandle` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "dietaryRestrictions",
DROP COLUMN "githubHandle",
ADD COLUMN     "branch" TEXT,
ADD COLUMN     "name" TEXT,
ADD COLUMN     "phoneNumber" TEXT,
ADD COLUMN     "year" TEXT;
