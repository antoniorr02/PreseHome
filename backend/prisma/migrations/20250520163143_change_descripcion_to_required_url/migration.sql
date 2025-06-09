/*
  Warnings:

  - You are about to drop the column `descripcion` on the `Categoria` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Categoria" DROP COLUMN "descripcion",
ADD COLUMN     "url_imagen" TEXT NOT NULL DEFAULT '';
