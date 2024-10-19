/*
  Warnings:

  - You are about to drop the column `sectionId` on the `File` table. All the data in the column will be lost.
  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Section` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "sectionId";

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("name");
