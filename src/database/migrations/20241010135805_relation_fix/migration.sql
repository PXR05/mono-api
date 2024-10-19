/*
  Warnings:

  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `authorId` on table `File` required. This step will fail if there are existing NULL values in that column.
  - Made the column `authorId` on table `Section` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Section" DROP CONSTRAINT "Section_authorId_fkey";

-- AlterTable
ALTER TABLE "File" ALTER COLUMN "authorId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
ALTER COLUMN "authorId" SET NOT NULL,
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("name", "authorId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
