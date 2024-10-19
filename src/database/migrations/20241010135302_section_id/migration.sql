/*
  Warnings:

  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `section` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_sectionId_fkey";

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "section" TEXT NOT NULL,
ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("id");
