/*
  Warnings:

  - Changed the type of `calificacion` on the `Reseña` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Reseña" DROP COLUMN "calificacion",
ADD COLUMN     "calificacion" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "Calificacion";
