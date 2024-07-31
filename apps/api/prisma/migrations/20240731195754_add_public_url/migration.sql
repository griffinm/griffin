/*
  Warnings:

  - Added the required column `public_url` to the `media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "media" ADD COLUMN     "public_url" TEXT NOT NULL;
