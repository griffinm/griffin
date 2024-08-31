-- AlterTable
ALTER TABLE "notebooks" ADD COLUMN     "is_default" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_id" TEXT;

-- AddForeignKey
ALTER TABLE "notebooks" ADD CONSTRAINT "notebooks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "notebooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
