/*
  Warnings:

  - Added the required column `estado` to the `DetallePedido` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EstadoDetalle" AS ENUM ('activo', 'devolución', 'devuelto', 'cancelado');

-- AlterEnum
ALTER TYPE "Estado" ADD VALUE 'cancelado';

-- AlterTable
ALTER TABLE "DetallePedido" ADD COLUMN     "estado" "EstadoDetalle" NOT NULL;
