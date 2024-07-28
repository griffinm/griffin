-- AlterTable
ALTER TABLE "notebooks" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "deleted_at" TIMESTAMP(3);
