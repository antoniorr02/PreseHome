/*
  Warnings:

  - Added the required column `direccion_id` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "direccion_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_direccion_id_fkey" FOREIGN KEY ("direccion_id") REFERENCES "Direccion"("direccion_id") ON DELETE RESTRICT ON UPDATE CASCADE;
