/*
  Warnings:

  - A unique constraint covering the columns `[cliente_id]` on the table `Carrito` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Carrito_cliente_id_key" ON "Carrito"("cliente_id");
