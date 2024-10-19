/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `section` on the `File` table. All the data in the column will be lost.
  - The primary key for the `Section` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[path,authorId]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,authorId]` on the table `Section` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sectionId` to the `File` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fileId` to the `Section` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Section` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropIndex
DROP INDEX "File_path_key";

-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "File_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "File_id_seq";

-- AlterTable
ALTER TABLE "Section" DROP CONSTRAINT "Section_pkey",
ADD COLUMN     "fileId" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Section_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "Backup" (
    "id" SERIAL NOT NULL,
    "authorId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Backup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_path_authorId_key" ON "File"("path", "authorId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_authorId_key" ON "Section"("name", "authorId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Backup" ADD CONSTRAINT "Backup_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
