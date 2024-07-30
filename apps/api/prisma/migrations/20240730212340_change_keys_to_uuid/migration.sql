/*
  Warnings:

  - The primary key for the `media` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `notebooks` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `notes` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "media" DROP CONSTRAINT "media_note_id_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_notebook_id_fkey";

-- AlterTable
ALTER TABLE "media" DROP CONSTRAINT "media_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "note_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "media_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "media_id_seq";

-- AlterTable
ALTER TABLE "notebooks" DROP CONSTRAINT "notebooks_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "notebooks_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "notebooks_id_seq";

-- AlterTable
ALTER TABLE "notes" DROP CONSTRAINT "notes_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "notebook_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "notes_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "notes_id_seq";

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_notebook_id_fkey" FOREIGN KEY ("notebook_id") REFERENCES "notebooks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
