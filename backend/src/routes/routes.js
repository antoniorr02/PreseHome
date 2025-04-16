export default async function (fastify, options) {
  const { prisma } = options

  fastify.get('/categorias', async (request, reply) => {
    try {
      const categorias = await prisma.categoria.findMany()
      return reply.send(categorias)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al obtener las categorías', details: error.message })
    }
  })

  fastify.get('/categorias/:id/productos', async (request, reply) => {
    const { id } = request.params
    try {
      const productos = await prisma.producto.findMany({
        where: {
          categorias: {
            some: {
              categoria_id: parseInt(id)
            }
          }
        },
        include: {
          imagenes: true,
          categorias: {
            include: {
              categoria: true
            }
          }
        }
      })
      return reply.send(productos)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al obtener los productos de la categoría', details: error.message })
    }
  })

  fastify.get('/productos', async (request, reply) => {
    const { search } = request.query;

    try {
        const productos = await prisma.producto.findMany({
            where: search ? {
                nombre: {
                    contains: search.trim(),
                    mode: 'insensitive',
                }
            } : {},
            include: {
                imagenes: true,
            },
            orderBy: { nombre: 'asc' }
        });
        return reply.send(productos);
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Error en la base de datos' });
    }
});


  // BORRAR?
  // fastify.get('/productos/:id', async (request, reply) => {
  //   const { id } = request.params
  //   const producto = await prisma.producto.findUnique({
  //     where: { producto_id: parseInt(id) },
  //     include: { imagenes: true, categorias: { include: { categoria: true } }, reseñas: true },
  //   })
  //   if (!producto) {
  //     return reply.status(404).send({ error: 'Producto no encontrado' })
  //   }
  //   return reply.send(producto)
  // })

  
  // A partir de aqui pedidos y carrito ir viendo según hagan falta

  fastify.post('/clientes/:clienteId/pedidos', async (request, reply) => {
    const { clienteId } = request.params
    const { items } = request.body // Array de { producto_id, cantidad, precio_unitario }

    try {
      const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)

      const nuevoPedido = await prisma.pedido.create({
        data: {
          total,
          estado: 'pendiente',
          detalle_pedido: {
            create: items,
          },
          pedidos: {
            create: { cliente_id: parseInt(clienteId) },
          },
        },
        include: { detalle_pedido: true },
      })
      return reply.status(201).send(nuevoPedido)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al crear el pedido', details: error.message })
    }
  })

  fastify.get('/clientes/:clienteId/pedidos', async (request, reply) => {
    const { clienteId } = request.params

    const pedidos = await prisma.clientePedido.findMany({
      where: { cliente_id: parseInt(clienteId) },
      include: { pedido: { include: { detalle_pedido: true } } },
    })
    return reply.send(pedidos)
  })

  fastify.put('/pedidos/:id/estado', async (request, reply) => {
    const { id } = request.params
    const { estado } = request.body

    try {
      const pedidoActualizado = await prisma.pedido.update({
        where: { pedido_id: parseInt(id) },
        data: { estado },
      })
      return reply.send(pedidoActualizado)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al actualizar el estado del pedido', details: error.message })
    }
  })

  fastify.get('/clientes/:clienteId/carrito', async (request, reply) => {
    const { clienteId } = request.params

    const carrito = await prisma.carrito.findUnique({
      where: { cliente_id: parseInt(clienteId) },
      include: { items: { include: { producto: true } } },
    })
    if (!carrito) {
      return reply.status(404).send({ error: 'Carrito no encontrado' })
    }
    return reply.send(carrito)
  })

  fastify.post('/clientes/:clienteId/carrito/items', async (request, reply) => {
    const { clienteId } = request.params
    const { producto_id, cantidad } = request.body

    try {
      let carrito = await prisma.carrito.findUnique({
        where: { cliente_id: parseInt(clienteId) },
      })
      if (!carrito) {
        carrito = await prisma.carrito.create({
          data: { cliente_id: parseInt(clienteId) },
        })
      }

      const item = await prisma.itemCarrito.upsert({
        where: {
          carrito_id_producto_id: {
            carrito_id: carrito.carrito_id,
            producto_id: producto_id,
          },
        },
        update: { cantidad },
        create: {
          carrito_id: carrito.carrito_id,
          producto_id,
          cantidad,
        },
      })
      return reply.status(201).send(item)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al actualizar el carrito', details: error.message })
    }
  })

  fastify.delete('/clientes/:clienteId/carrito/items/:productoId', async (request, reply) => {
    const { clienteId, productoId } = request.params

    try {
      const carrito = await prisma.carrito.findUnique({
        where: { cliente_id: parseInt(clienteId) },
      })
      if (!carrito) {
        return reply.status(404).send({ error: 'Carrito no encontrado' })
      }
      await prisma.itemCarrito.delete({
        where: {
          carrito_id_producto_id: {
            carrito_id: carrito.carrito_id,
            producto_id: parseInt(productoId),
          },
        },
      })
      return reply.status(204).send()
    } catch (error) {
      return reply.status(400).send({ error: 'Error al eliminar el item del carrito', details: error.message })
    }
  })

  fastify.post('/productos/:productoId/reseñas', async (request, reply) => {
    const { productoId } = request.params
    const { cliente_id, calificacion, comentario } = request.body

    try {
      const nuevaReseña = await prisma.reseña.create({
        data: {
          producto_id: parseInt(productoId),
          cliente_id,
          calificacion,
          comentario,
        },
      })
      return reply.status(201).send(nuevaReseña)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al crear la reseña', details: error.message })
    }
  })

  fastify.get('/productos/:productoId/reseñas', async (request, reply) => {
    const { productoId } = request.params
    const reseñas = await prisma.reseña.findMany({
      where: { producto_id: parseInt(productoId) },
      include: { cliente: true },
    })
    return reply.send(reseñas)
  })
}