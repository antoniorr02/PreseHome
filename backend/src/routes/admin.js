import jwt from "jsonwebtoken";

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

      fastify.get('/ingresos', async (request, reply) => {
        try {
            // Verificación de autenticación y permisos (igual que antes)
            const token = request.cookies.token;
            if (!token) {
                return reply.status(401).send({ error: "No autenticado" });
            }
    
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const admin = await prisma.cliente.findUnique({
                where: { email: decoded.email }
            });
            
            if (!admin || admin.rol != 'Admin') {
                return reply.status(403).send({ error: "Acceso no autorizado" });
            }
    
            const { periodo } = request.query;
            const validPeriods = ['semana', 'mes', 'semestre'];
            if (!periodo || !validPeriods.includes(periodo)) {
                return reply.status(400).send({ error: "Parámetro 'periodo' inválido" });
            }
    
            // Obtener pedidos entregados
            const orders = await prisma.pedido.findMany({
                where: {
                    estado: {
                        in: ['pendiente', 'enviado', 'entregado']
                    },
                    fecha_pedido: {
                        gte: getStartDate(periodo)
                    }
                },
                include: {
                    detalle_pedido: {
                        where: {
                            estado: {
                                in: ['pendiente', 'enviado', 'entregado']
                            }
                        },
                        include: {
                            producto: {
                                select: {
                                    descuento: true
                                }
                            }
                        }
                    }
                }
            });
    
            // Procesar los datos según el período
            let result;
            if (periodo === 'semana') {
                result = processWeekData(orders);
            } else if (periodo === 'mes') {
                result = processMonthData(orders);
            } else {
                result = processSemesterData(orders);
            }
    
            return reply.send(result);
        } catch (err) {
            console.error('Error al obtener los ingresos:', err);
            reply.status(500).send({ error: 'Error al obtener datos de ingresos.' });
        }
    });
    
    // Funciones auxiliares
    function getStartDate(periodo) {
        const now = new Date();
        switch (periodo) {
            case 'semana':
                return new Date(now.setDate(now.getDate() - 7));
            case 'mes':
                return new Date(now.setMonth(now.getMonth() - 1));
            case 'semestre':
                return new Date(now.setMonth(now.getMonth() - 6));
            default:
                return new Date(now.setDate(now.getDate() - 7));
        }
    }
    
    function processWeekData(orders) {
      const now = new Date();
      const dates = [];
  
      // Generar los últimos 7 días con formato YYYY-MM-DD
      for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const iso = date.toISOString().slice(0, 10); // yyyy-mm-dd
          dates.push({ fecha: iso, ingresos: 0 });
      }
  
      orders.forEach(order => {
          const orderDate = new Date(order.fecha_pedido).toISOString().slice(0, 10);
          const target = dates.find(d => d.fecha === orderDate);
          if (target) {
              const total = order.detalle_pedido.reduce((sum, item) => {
                  const price = parseFloat(item.precio_unitario);
                  const discount = parseFloat(item.producto?.descuento || 0);
                  return sum + (price * (1 - discount / 100) * item.cantidad);
              }, 0);
              target.ingresos += total;
          }
      });
  
      return dates;
    } 
    
    function processMonthData(orders) {
      const result = [
          { semana: '1ª', ingresos: 0 },
          { semana: '2ª', ingresos: 0 },
          { semana: '3ª', ingresos: 0 },
          { semana: '4ª', ingresos: 0 }
      ];
  
      orders.forEach(order => {
          const orderDate = new Date(order.fecha_pedido);
          const weekIndex = Math.min(Math.floor((orderDate.getDate() - 1) / 7), 3);
  
          const total = order.detalle_pedido.reduce((sum, item) => {
              const price = parseFloat(item.precio_unitario);
              const discount = parseFloat(item.producto?.descuento || 0);
              return sum + (price * (1 - discount / 100) * item.cantidad);
          }, 0);
  
          result[weekIndex].ingresos += total;
      });
  
      return result;
    }

    function getMonthLabels(startMonth) {
      const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const result = [];
      for (let i = 0; i < 6; i++) {
        result.push(labels[(startMonth + i) % 12]);
      }
      return result;
    }
    
    function processSemesterData(orders) {
      const currentMonth = new Date().getMonth();
      const startMonth = (currentMonth + 12 - 5) % 12;
      const monthLabels = getMonthLabels(startMonth);
    
      const months = [];
      for (let i = 0; i < 6; i++) {
        months.push({ mes: monthLabels[i], ingresos: 0 });
      }
    
      orders.forEach(order => {
        const orderDate = new Date(order.fecha_pedido);
        const orderMonth = orderDate.getMonth();
        const diff = orderMonth - startMonth;
        const index = diff >= 0 ? diff : diff + 12;
        if (index >= 0 && index < 6) {
          const total = order.detalle_pedido.reduce((sum, item) => {
            const price = parseFloat(item.precio_unitario);
            const discount = parseFloat(item.producto?.descuento || 0);
            return sum + (price * (1 - discount / 100) * item.cantidad);
          }, 0);
    
          months[index].ingresos += total;
        }
      });
    
      return months;
    } 

  }