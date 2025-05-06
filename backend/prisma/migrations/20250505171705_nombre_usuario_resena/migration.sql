/*
  Warnings:

  - Made the column `nombre_usuario` on table `Reseña` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Reseña" ALTER COLUMN "nombre_usuario" SET NOT NULL;
