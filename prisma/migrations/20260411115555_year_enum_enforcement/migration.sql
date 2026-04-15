/*
  Warnings:

  - The `year` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "AcademicYear" AS ENUM ('1st Year', '2nd Year');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "year",
ADD COLUMN     "year" "AcademicYear";
