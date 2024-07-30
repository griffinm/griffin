/*
  Warnings:

  - You are about to drop the column `url` on the `media` table. All the data in the column will be lost.
  - Added the required column `key` to the `media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `media` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "media" DROP COLUMN "url",
ADD COLUMN     "key" TEXT NOT NULL,
ADD COLUMN     "mime_type" TEXT NOT NULL,
ADD COLUMN     "size" INTEGER NOT NULL;
