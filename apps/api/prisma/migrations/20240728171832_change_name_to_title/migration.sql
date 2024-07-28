/*
  Warnings:

  - You are about to drop the column `name` on the `notebooks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notebooks" DROP COLUMN "name",
ADD COLUMN     "title" TEXT;

-- AlterTable
ALTER TABLE "notes" ALTER COLUMN "title" DROP NOT NULL,
ALTER COLUMN "content" DROP NOT NULL;
