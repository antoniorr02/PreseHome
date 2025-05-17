/*
  Warnings:

  - The values [activo] on the enum `EstadoDetalle` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EstadoDetalle_new" AS ENUM ('pendiente', 'enviado', 'entregado', 'cancelado', 'devolución', 'devuelto');
ALTER TABLE "DetallePedido" ALTER COLUMN "estado" TYPE "EstadoDetalle_new" USING ("estado"::text::"EstadoDetalle_new");
ALTER TYPE "EstadoDetalle" RENAME TO "EstadoDetalle_old";
ALTER TYPE "EstadoDetalle_new" RENAME TO "EstadoDetalle";
DROP TYPE "EstadoDetalle_old";
COMMIT;
