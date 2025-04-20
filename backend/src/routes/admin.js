export default async function (fastify, options) {
    const { prisma } = options

    fastify.get('/clientes', async (request, reply) => {
        const clientes = await prisma.cliente.findMany()
        return reply.send(clientes)
      });
    



      ////////////////////

    //   fastify.get('/clientes/:id', async (request, reply) => {
    //     const { id } = request.params
    //     const cliente = await prisma.cliente.findUnique({
    //       where: { cliente_id: parseInt(id) },
    //     })
    //     if (!cliente) {
    //       return reply.status(404).send({ error: 'Cliente no encontrado' })
    //     }
    //     return reply.send(cliente)
    //   });

    //   fastify.delete('/clientes/:id', async (request, reply) => {
    //     const { id } = request.params
    
    //     try {
    //       await prisma.cliente.delete({
    //         where: { cliente_id: parseInt(id) },
    //       })
    //       return reply.status(204).send()
    //     } catch (error) {
    //       return reply.status(400).send({ error: 'Error al eliminar el cliente', details: error.message })
    //     }
    //   });

    //   fastify.post('/categorias', async (request, reply) => {
    //     const { nombre, descripcion } = request.body
    //     try {
    //       const nuevaCategoria = await prisma.categoria.create({
    //         data: {
    //           nombre,
    //           descripcion,
    //         },
    //       })
    //       return reply.status(201).send(nuevaCategoria)
    //     } catch (error) {
    //       return reply.status(400).send({ error: 'Error al crear la categoría', details: error.message })
    //     }
    //   })  
    
    //   fastify.put('/categorias/:id', async (request, reply) => {
    //     const { id } = request.params
    //     const { nombre, descripcion } = request.body
    //     try {
    //       const categoriaActualizada = await prisma.categoria.update({
    //         where: { categoria_id: parseInt(id) },
    //         data: { nombre, descripcion }
    //       })
    //       return reply.send(categoriaActualizada)
    //     } catch (error) {
    //       return reply.status(400).send({ error: 'Error al actualizar la categoría', details: error.message })
    //     }
    //   })
      
    //   fastify.delete('/categorias/:id', async (request, reply) => {
    //     const { id } = request.params
    //     try {
    //       await prisma.categoria.delete({
    //         where: { categoria_id: parseInt(id) }
    //       })
    //       return reply.status(204).send()
    //     } catch (error) {
    //       return reply.status(400).send({ error: 'Error al eliminar la categoría', details: error.message })
    //     }
    //   })

    fastify.post('/productos', async (request, reply) => {
        const { nombre, marca, descripcion, precio, stock, imagenes, categoriaIds } = request.body
    
        try {
          const nuevoProducto = await prisma.producto.create({
            data: {
              nombre,
              marca,
              descripcion,
              precio,
              stock,
              imagenes: {
                create: imagenes, // Array de { principal, url }
              },
              categorias: {
                create: categoriaIds.map((categoria_id) => ({ categoria_id })),
              },
            },
            include: { imagenes: true, categorias: true },
          })
          return reply.status(201).send(nuevoProducto)
        } catch (error) {
          return reply.status(400).send({ error: 'Error al crear el producto', details: error.message })
        }
      })
    
      fastify.put('/productos/:id', async (request, reply) => {
        const { id } = request.params
        const data = request.body
    
        try {
          const productoActualizado = await prisma.producto.update({
            where: { producto_id: parseInt(id) },
            data,
          })
          return reply.send(productoActualizado)
        } catch (error) {
          return reply.status(400).send({ error: 'Error al actualizar el producto', details: error.message })
        }
      })
    
      fastify.delete('/productos/:id', async (request, reply) => {
        const { id } = request.params;
        try {
          await prisma.$transaction([
            prisma.productoCategoria.deleteMany({
              where: { producto_id: parseInt(id) },
            }),
            prisma.imagenProducto.deleteMany({
              where: { producto_id: parseInt(id) },
            }),
            prisma.producto.delete({
              where: { producto_id: parseInt(id) },
            }),
          ]);
          return reply.status(204).send();
        } catch (error) {
          return reply.status(400).send({ error: 'Error al eliminar el producto', details: error.message });
        }
      });
    
}