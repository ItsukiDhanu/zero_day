-- AlterTable
ALTER TABLE "TeamPayment" ADD COLUMN     "receipt_data" BYTEA,
ADD COLUMN     "receipt_file_name" TEXT,
ADD COLUMN     "receipt_mime_type" TEXT;
