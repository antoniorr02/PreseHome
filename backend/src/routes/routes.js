import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {enviarCorreoConfirmacion} from './emailConfirmacion.js'; 

export default async function (fastify, options) {
  const { prisma } = options

  fastify.get('/clientes', async (request, reply) => {
    const clientes = await prisma.cliente.findMany()
    return reply.send(clientes)
  })

  fastify.get('/clientes/:id', async (request, reply) => {
    const { id } = request.params
    const cliente = await prisma.cliente.findUnique({
      where: { cliente_id: parseInt(id) },
    })
    if (!cliente) {
      return reply.status(404).send({ error: 'Cliente no encontrado' })
    }
    return reply.send(cliente)
  })

  fastify.post('/clientes', async (request, reply) => {
    const { nombre, apellidos, email, password } = request.body;

    try {
        const existingUser = await prisma.cliente.findUnique({ where: { email } });
        if (existingUser) {
            return reply.status(400).send({ error: 'El correo ya está en uso' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token_tmp = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "24h" });

        const nuevoCliente = await prisma.cliente.create({
            data: {
                nombre,
                apellidos,
                email,
                password: hashedPassword,
                token: token_tmp,
                carrito: {
                    create: {}
                }
            },
            include: {
                carrito: true
            }
        });
        await enviarCorreoConfirmacion(email, token_tmp);
        return reply.status(201).send({ message: 'Usuario registrado correctamente. Por favor, revisa tu correo para confirmar tu cuenta.' });
    } catch (error) {
        console.error('Error al generar el token:', error.message);
        return reply.status(500).send({ error: 'Error al registrar el cliente', details: error.message });
    }
  })

  fastify.post('/reenviar', async (request, reply) => {
    const { email } = request.body;

    if (!email) {
        return reply.status(400).send({ error: 'El correo es obligatorio' });
    }

    try {
        const cliente = await prisma.cliente.findUnique({ where: { email } });

        if (!cliente) {
            return reply.status(404).send({ error: 'Usuario no encontrado' });
        }

        if (cliente.confirmado) {
            return reply.status(400).send({ error: 'El usuario ya está confirmado' });
        }

        await enviarCorreoConfirmacion(cliente.email, cliente.token);

        return reply.send({ message: 'Correo de confirmación reenviado correctamente' });
    } catch (error) {
        console.error('Error al reenviar confirmación:', error);
        return reply.status(500).send({ error: 'Error interno del servidor' });
    }
  })


  fastify.post("/confirmar", async (request, reply) => {
    const { token } = request.body;

    console.log('Token recibido:', token);

    try {
        const cliente = await prisma.cliente.findUnique({
            where: { token },
        });

        if (!cliente) {
            return reply.status(404).send({ success: false, error: "Usuario no encontrado" });
        }

        if (cliente.confirmado) {
            return reply.status(400).send({ success: false, error: "La cuenta ya está confirmada" });
        }

        await prisma.cliente.update({
            where: { token },
            data: { confirmado: true },
        });
        
        const jwtToken = jwt.sign({ email: cliente.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
                await prisma.cliente.update({
            where: { email: cliente.email }, 
            data: { token: jwtToken },
        });
        
        reply.setCookie("token", jwtToken, {
            httpOnly: true, 
            secure: false,
            sameSite: "Strict",
            path: "/",
            maxAge: 2 * 60 * 60,
        });

        return reply.send({ 
            success: true, 
            message: "Cuenta confirmada exitosamente",
            token: jwtToken
        });
    } catch (error) {
        console.error('Error al confirmar la cuenta:', error);
        return reply.status(400).send({ success: false, error: "No se ha podido confirmar la cuenta" });
    }
  })

  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    const user = await prisma.cliente.findUnique({
      where: { email },
    });

    if (!user) {
        return reply.status(401).send({ error: 'Correo electrónico o contraseña incorrectos' });
    }
    
    if (!user.confirmado) {
        return reply.status(401).send({ error: 'Usuario no verificpasswordado' });
    }
    
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return reply.status(401).send({ error: 'Correo electrónico o contraseña incorrectos' });
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
    await prisma.cliente.update({
      where: { email: user.email }, 
      data: { token: token },
    });

    reply.setCookie("token", token, {
      httpOnly: true, 
      secure: false, //process.env.IN === "production",
      sameSite: "Strict",
      path: "/",
      maxAge: 2 * 60 * 60,
    });

    reply.send({ message: 'Inicio de sesión exitoso', token });
  })

  fastify.put('/clientes/:id', async (request, reply) => {
    const { id } = request.params
    const data = request.body

    try {
      const clienteActualizado = await prisma.cliente.update({
        where: { cliente_id: parseInt(id) },
        data,
      })
      return reply.send(clienteActualizado)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al actualizar el cliente', details: error.message })
    }
  })

  fastify.delete('/clientes/:id', async (request, reply) => {
    const { id } = request.params

    try {
      await prisma.cliente.delete({
        where: { cliente_id: parseInt(id) },
      })
      return reply.status(204).send()
    } catch (error) {
      return reply.status(400).send({ error: 'Error al eliminar el cliente', details: error.message })
    }
  })

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

  fastify.post('/categorias', async (request, reply) => {
    const { nombre, descripcion } = request.body
    try {
      const nuevaCategoria = await prisma.categoria.create({
        data: {
          nombre,
          descripcion,
        },
      })
      return reply.status(201).send(nuevaCategoria)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al crear la categoría', details: error.message })
    }
  })  

  fastify.put('/categorias/:id', async (request, reply) => {
    const { id } = request.params
    const { nombre, descripcion } = request.body
    try {
      const categoriaActualizada = await prisma.categoria.update({
        where: { categoria_id: parseInt(id) },
        data: { nombre, descripcion }
      })
      return reply.send(categoriaActualizada)
    } catch (error) {
      return reply.status(400).send({ error: 'Error al actualizar la categoría', details: error.message })
    }
  })
  
  fastify.delete('/categorias/:id', async (request, reply) => {
    const { id } = request.params
    try {
      await prisma.categoria.delete({
        where: { categoria_id: parseInt(id) }
      })
      return reply.status(204).send()
    } catch (error) {
      return reply.status(400).send({ error: 'Error al eliminar la categoría', details: error.message })
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


  fastify.get('/productos/:id', async (request, reply) => {
    const { id } = request.params
    const producto = await prisma.producto.findUnique({
      where: { producto_id: parseInt(id) },
      include: { imagenes: true, categorias: { include: { categoria: true } }, reseñas: true },
    })
    if (!producto) {
      return reply.status(404).send({ error: 'Producto no encontrado' })
    }
    return reply.send(producto)
  })

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