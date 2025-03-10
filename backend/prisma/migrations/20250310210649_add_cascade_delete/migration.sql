-- DropForeignKey
ALTER TABLE "Carrito" DROP CONSTRAINT "Carrito_cliente_id_fkey";

-- AddForeignKey
ALTER TABLE "Carrito" ADD CONSTRAINT "Carrito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE CASCADE ON UPDATE CASCADE;
