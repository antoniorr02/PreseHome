-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('Cliente', 'Admin');

-- CreateEnum
CREATE TYPE "Estado" AS ENUM ('pendiente', 'enviado', 'entregado');

-- CreateEnum
CREATE TYPE "Calificacion" AS ENUM ('E', 'D', 'C', 'B', 'A');

-- CreateEnum
CREATE TYPE "TipoTarjeta" AS ENUM ('VISA', 'Mastercard', 'AMEX');

-- CreateEnum
CREATE TYPE "EstadoTarjeta" AS ENUM ('Activa', 'Expirada', 'Bloqueada', 'Eliminada');

-- CreateTable
CREATE TABLE "Cliente" (
    "cliente_id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "numero_direccion" INTEGER NOT NULL,
    "piso" TEXT,
    "ciudad" TEXT NOT NULL,
    "cod_postal" TEXT NOT NULL,
    "pais" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rol" "Rol" NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("cliente_id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "producto_id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DECIMAL(65,30) NOT NULL,
    "stock" INTEGER NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("producto_id")
);

-- CreateTable
CREATE TABLE "ImagenProducto" (
    "imagen_id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "principal" BOOLEAN NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "ImagenProducto_pkey" PRIMARY KEY ("imagen_id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "categoria_id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("categoria_id")
);

-- CreateTable
CREATE TABLE "Pedido" (
    "pedido_id" SERIAL NOT NULL,
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "Estado" NOT NULL,
    "total" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "Pedido_pkey" PRIMARY KEY ("pedido_id")
);

-- CreateTable
CREATE TABLE "DetallePedido" (
    "pedido_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "DetallePedido_pkey" PRIMARY KEY ("pedido_id","producto_id")
);

-- CreateTable
CREATE TABLE "Carrito" (
    "carrito_id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,

    CONSTRAINT "Carrito_pkey" PRIMARY KEY ("carrito_id")
);

-- CreateTable
CREATE TABLE "ItemCarrito" (
    "carrito_id" INTEGER NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "ItemCarrito_pkey" PRIMARY KEY ("carrito_id","producto_id")
);

-- CreateTable
CREATE TABLE "Reseña" (
    "reseña_id" SERIAL NOT NULL,
    "producto_id" INTEGER NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "calificacion" "Calificacion" NOT NULL,
    "comentario" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reseña_pkey" PRIMARY KEY ("reseña_id")
);

-- CreateTable
CREATE TABLE "Tarjeta" (
    "id_tarjeta" SERIAL NOT NULL,
    "num_tarjeta" TEXT NOT NULL,
    "tipo_tarjeta" "TipoTarjeta" NOT NULL,
    "banco" TEXT NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "estado" "EstadoTarjeta" NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "Tarjeta_pkey" PRIMARY KEY ("id_tarjeta")
);

-- CreateTable
CREATE TABLE "ProductoCategoria" (
    "producto_id" INTEGER NOT NULL,
    "categoria_id" INTEGER NOT NULL,

    CONSTRAINT "ProductoCategoria_pkey" PRIMARY KEY ("producto_id","categoria_id")
);

-- CreateTable
CREATE TABLE "ClientePedido" (
    "cliente_id" INTEGER NOT NULL,
    "pedido_id" INTEGER NOT NULL,

    CONSTRAINT "ClientePedido_pkey" PRIMARY KEY ("cliente_id","pedido_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "Cliente"("email");

-- AddForeignKey
ALTER TABLE "ImagenProducto" ADD CONSTRAINT "ImagenProducto_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("pedido_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetallePedido" ADD CONSTRAINT "DetallePedido_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Carrito" ADD CONSTRAINT "Carrito_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCarrito" ADD CONSTRAINT "ItemCarrito_carrito_id_fkey" FOREIGN KEY ("carrito_id") REFERENCES "Carrito"("carrito_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemCarrito" ADD CONSTRAINT "ItemCarrito_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reseña" ADD CONSTRAINT "Reseña_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reseña" ADD CONSTRAINT "Reseña_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarjeta" ADD CONSTRAINT "Tarjeta_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoCategoria" ADD CONSTRAINT "ProductoCategoria_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("producto_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductoCategoria" ADD CONSTRAINT "ProductoCategoria_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "Categoria"("categoria_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePedido" ADD CONSTRAINT "ClientePedido_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "Cliente"("cliente_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientePedido" ADD CONSTRAINT "ClientePedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "Pedido"("pedido_id") ON DELETE RESTRICT ON UPDATE CASCADE;
