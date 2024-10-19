/*
  Warnings:

  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Section` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_sectionId_fkey";

-- DropIndex
DROP INDEX "Section_name_key";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "sectionId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("name");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
