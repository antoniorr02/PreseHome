import jwt from "jsonwebtoken";

export default async function carritoRoutes(fastify, options) {
    const { prisma } = options

    fastify.get('/carrito', async (request, reply) => {
        try {
            const token = request.cookies.token;
            if (!token) {
                return reply.status(401).send({ error: "No autenticado" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const email = decoded.email;
        
            if (!email) {
                return reply.status(401).send({ error: 'No autenticado' });
            }

            const cliente = await prisma.Cliente.findUnique({
                where: {
                    email: email,
                }
            });
        
            const carrito = await prisma.carrito.findUnique({
                where: {
                cliente_id: cliente.cliente_id,
                },
                include: {
                items: {
                    include: {
                    producto: {
                        include: {
                        imagenes: {
                            where: { principal: true },
                            select: { url: true },
                        },
                        },
                    },
                    },
                },
                },
            });
        
            if (!carrito) {
                return reply.send([]);
            }
        
            const itemsFormateados = carrito.items.map((item) => ({
                producto_id: item.producto_id,
                nombre: item.producto.nombre,
                precio: item.producto.precio,
                descuento: item.producto.descuento,
                quantity: item.cantidad,
                imagen: item.producto.imagenes[0]?.url || null,
            }));
        
            return reply.send(itemsFormateados);
        } catch (error) {
            console.error('Error al obtener el carrito:', error);
            return reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });
      

    fastify.post('/carrito', async (request, reply) => {
        const userId = request.user.cliente_id;
        const { producto_id, cantidad } = request.body;
    
        // Asegurar que el carrito existe
        let carrito = await prisma.carrito.findUnique({
            where: { cliente_id: userId },
        });
    
        if (!carrito) {
            carrito = await prisma.carrito.create({
                data: {
                cliente_id: userId,
                },
            });
        }
    
        // Buscar si ya existe el item
        const existingItem = await prisma.itemCarrito.findUnique({
            where: {
                carrito_id_producto_id: {
                carrito_id: carrito.carrito_id,
                producto_id,
                },
            },
        });
    
        if (existingItem) {
        // Actualizar la cantidad
        await prisma.itemCarrito.update({
            where: {
                carrito_id_producto_id: {
                    carrito_id: carrito.carrito_id,
                    producto_id,
                },
                },
                data: {
                cantidad,
            },
        });
        } else {
        // Agregar nuevo item
        await prisma.itemCarrito.create({
            data: {
            carrito_id: carrito.carrito_id,
            producto_id,
            cantidad,
            },
        });
        }
    
        return reply.send({ ok: true });
    });
  
    fastify.delete('/carrito/:producto_id', async (request, reply) => {
        const userId = request.user.cliente_id;
        const producto_id = parseInt(request.params.producto_id);
    
        const carrito = await prisma.carrito.findUnique({
        where: { cliente_id: userId },
        });
    
        if (!carrito) return reply.status(404).send({ error: 'Carrito no encontrado' });
    
        await prisma.itemCarrito.delete({
        where: {
            carrito_id_producto_id: {
            carrito_id: carrito.carrito_id,
            producto_id,
            },
        },
        });
    
        return reply.send({ ok: true });
    });
  
    fastify.post('/carrito/sincronizar', async (request, reply) => {
        const email = request.headers.authorization;
    
        // Buscar el cliente por email
        const user = await prisma.cliente.findUnique({
            where: { email },
        });
    
        if (!user) {
            return reply.code(404).send({ error: "Usuario no encontrado" });
        }
    
        const { items } = request.body;
    
        // Buscar el carrito asociado al cliente_id
        const carrito = await prisma.carrito.findUnique({
            where: { cliente_id: user.cliente_id },
        });

    
        if (!carrito) {
            return reply.code(404).send({ error: "Carrito no encontrado para el usuario" });
        }
    
        for (const item of items) {
            const existing = await prisma.ItemCarrito.findUnique({
                where: {
                    carrito_id_producto_id: {
                        carrito_id: carrito.carrito_id,
                        producto_id: item.producto_id,
                    },
                },
            });
    
            if (existing) {
                await prisma.ItemCarrito.update({
                    where: {
                        carrito_id_producto_id: {
                            carrito_id: carrito.carrito_id,
                            producto_id: item.producto_id,
                        },
                    },
                    data: {
                        cantidad: existing.cantidad + item.quantity,
                    },
                });
            } else {
                await prisma.ItemCarrito.create({
                    data: {
                        carrito_id: carrito.carrito_id,
                        producto_id: item.producto_id,
                        cantidad: item.quantity,
                    },
                });
            }
        }
    
        return reply.send({ ok: true });
    });
    
  
  
}