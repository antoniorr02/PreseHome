/*
  Warnings:

  - You are about to drop the `ClientePedido` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cliente_id` to the `Pedido` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ClientePedido" DROP CONSTRAINT "ClientePedido_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "ClientePedido" DROP CONSTRAINT "ClientePedido_pedido_id_fkey";

-- AlterTable
ALTER TABLE "Pedido" ADD COLUMN     "cliente_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ClientePedido";

-- AddForeignKey
ALTER TABLE "Pedido" ADD CONSTRAINT "Pedido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;
