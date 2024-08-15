-- AlterTable
ALTER TABLE "notes" ADD COLUMN     "content_search_text" TEXT,
ADD COLUMN     "content_search_vector" tsvector;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password" TEXT NOT NULL DEFAULT '';
