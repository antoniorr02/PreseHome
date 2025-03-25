/*
  Warnings:

  - You are about to drop the column `calle` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `ciudad` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `cod_postal` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `numero_direccion` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `pais` on the `Cliente` table. All the data in the column will be lost.
  - You are about to drop the column `piso` on the `Cliente` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dni]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cliente" DROP COLUMN "calle",
DROP COLUMN "ciudad",
DROP COLUMN "cod_postal",
DROP COLUMN "numero_direccion",
DROP COLUMN "pais",
DROP COLUMN "piso",
ADD COLUMN     "dni" TEXT;

-- CreateTable
CREATE TABLE "Direccion" (
    "direccion_id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "calle" TEXT NOT NULL,
    "numero" INTEGER,
    "piso" TEXT,
    "ciudad" TEXT NOT NULL,
    "cod_postal" TEXT NOT NULL,
    "pais" TEXT NOT NULL,

    CONSTRAINT "Direccion_pkey" PRIMARY KEY ("direccion_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_dni_key" ON "Cliente"("dni");

-- AddForeignKey
ALTER TABLE "Direccion" ADD CONSTRAINT "Direccion_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;
