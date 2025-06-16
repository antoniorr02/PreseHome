import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import { join } from 'path';
import { enviarCorreoEstadoCuenta } from "../scripts/emailBaneo.js";
import { emailActualizacionPedido } from '../scripts/emailActualizacionPedido.js';
import { emailActualizacionDevolucion } from '../scripts/emailActualizacionDevolucion.js'

export default async function (fastify, options) {
    const { prisma } = options

fastify.get('/clientes', async (request, reply) => {
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

  const { 
    page = 1, 
    limit = 10,
    search = '',
    nombre = '',
    apellidos = '',
    estado = '',
    rol = '',
    sortField = 'fecha_registro',
    sortOrder = 'desc'
  } = request.query;

  const where = {
    AND: [
      {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { dni: { contains: search, mode: 'insensitive' } }
        ]
      },
      nombre ? { nombre: { contains: nombre, mode: 'insensitive' } } : {},
      apellidos ? { apellidos: { contains: apellidos, mode: 'insensitive' } } : {},
      estado ? { baneado: estado === 'baneado' } : {},
      rol ? { rol } : {}
    ].filter(cond => Object.keys(cond).length > 0) 
  };

  try {
    const total = await prisma.cliente.count({ where });

    const clientes = await prisma.cliente.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
      orderBy: {
        [sortField]: sortOrder
      },
      select: {
        cliente_id: true,
        dni: true,
        nombre: true,
        apellidos: true,
        email: true,
        rol: true,
        baneado: true,
        confirmado: true,
        fecha_registro: true,
        telefono: true
      }
    });

    return reply.send({
      data: clientes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    return reply.status(500).send({ error: "Error al obtener clientes" });
  }
});

fastify.patch('/clientes/:id/ban', async (request, reply) => {
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

  const { id } = request.params;
  const { banear } = request.body;

  try {
    const cliente = await prisma.cliente.update({
      where: { cliente_id: parseInt(id) },
      data: { baneado: banear }
    });

    await enviarCorreoEstadoCuenta(
      cliente.email, 
      banear ? 'ban' : 'unban', 
    );

    return reply.send({ 
      message: `Cliente ${banear ? 'baneado' : 'desbaneado'} correctamente`,
      cliente 
    });
  } catch (error) {
    console.error('Error al actualizar estado del cliente:', error);
    return reply.status(500).send({ error: "Error al actualizar estado del cliente" });
  }
});

  fastify.post('/admin', async (request, reply) => {
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

    const { nombre, apellidos, email, dni, password } = request.body;

    try {
        const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
        if (!/^\d{8}[A-Z]$/i.test(dni)) {
            return reply.status(400).send({ error: 'DNI no válido: formato incorrecto' });
        }
        
        const numero = parseInt(dni.substr(0, 8));
        const letra = dni.charAt(8).toUpperCase();
        const letraEsperada = letras[numero % 23];
        
        if (letra !== letraEsperada) {
            return reply.status(400).send({ error: 'DNI no válido: letra incorrecta' });
        }

        const existingUser = await prisma.cliente.findFirst({
            where: {
                OR: [
                    { email },
                    { dni }
                ]
            }
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return reply.status(400).send({ error: 'El correo ya está en uso' });
            }
            return reply.status(400).send({ error: 'El DNI ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const token_tmp = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "24h" });

        const nuevoAdmin = await prisma.cliente.create({
            data: {
                nombre,
                apellidos,
                email,
                dni,
                password: hashedPassword,
                token: token_tmp,
                rol: 'Admin',
                confirmado: true,
                carrito: {
                    create: {}
                }
            },
            include: {
                carrito: true
            }
        });

        return reply.status(201).send({ 
            message: 'Administrador creado correctamente',
            admin: {
                id: nuevoAdmin.cliente_id,
                nombre: nuevoAdmin.nombre,
                email: nuevoAdmin.email,
                rol: nuevoAdmin.rol
            }
        });

    } catch (error) {
        console.error('Error al crear administrador:', error);
        return reply.status(500).send({ 
            error: 'Error al crear el administrador',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
  });

  fastify.delete('/clientes/:id', async (request, reply) => {
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

    const { id } = request.params;

    try {
        await prisma.pedido.deleteMany({
            where: { cliente_id: parseInt(id) }
        });

        await prisma.reseña.deleteMany({
            where: { cliente_id: parseInt(id) }
        });

        await prisma.tarjeta.deleteMany({
            where: { cliente_id: parseInt(id) }
        });

        await prisma.direccion.deleteMany({
            where: { cliente_id: parseInt(id) }
        });

        const carrito = await prisma.carrito.findUnique({
            where: { cliente_id: parseInt(id) }
        });

        if (carrito) {
            await prisma.itemCarrito.deleteMany({
                where: { carrito_id: carrito.carrito_id }
            });

            await prisma.carrito.delete({
                where: { carrito_id: carrito.carrito_id }
            });
        }

        await prisma.cliente.delete({
            where: { cliente_id: parseInt(id) }
        });

        return reply.send({ 
            message: 'Cliente eliminado correctamente'
        });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        return reply.status(500).send({ error: "Error al eliminar el cliente" });
    }
  });

    fastify.post('/categorias', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) return reply.status(401).send({ error: "No autenticado" });
    
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.cliente.findUnique({ where: { email: decoded.email } });
      if (!admin || admin.rol !== 'Admin') {
        return reply.status(403).send({ error: "Acceso no autorizado" });
      }
    
      try {
        const { nombre, url_imagen } = request.body;
    
        const nuevaCategoria = await prisma.categoria.create({
          data: {
            nombre,
            url_imagen
          }
        });
    
        return reply.status(201).send(nuevaCategoria);
      } catch (error) {
        console.error('Error al crear categoría:', error);
        return reply.status(500).send({ error: "Error al crear categoría" });
      }
    });
    
    fastify.put('/categorias/:id', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) return reply.status(401).send({ error: "No autenticado" });
    
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.cliente.findUnique({ where: { email: decoded.email } });
      if (!admin || admin.rol !== 'Admin') {
        return reply.status(403).send({ error: "Acceso no autorizado" });
      }
    
      try {
        const { id } = request.params;
        const { nombre, url_imagen } = request.body;
    
        const categoriaActualizada = await prisma.categoria.update({
          where: { categoria_id: parseInt(id) },
          data: {
            nombre,
            url_imagen
          }
        });
    
        return reply.send(categoriaActualizada);
      } catch (error) {
        console.error('Error al actualizar categoría:', error);
        return reply.status(500).send({ error: "Error al actualizar categoría" });
      }
    });

    fastify.delete('/categorias/:id', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) return reply.status(401).send({ error: "No autenticado" });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.cliente.findUnique({ where: { email: decoded.email } });
      if (!admin || admin.rol !== 'Admin') {
          return reply.status(403).send({ error: "Acceso no autorizado" });
      }

      try {
          const { id } = request.params;
          
          await prisma.productoCategoria.deleteMany({
              where: { categoria_id: parseInt(id) }
          });

          await prisma.categoria.delete({
              where: { categoria_id: parseInt(id) }
          });

          return reply.send({ message: 'Categoría eliminada correctamente' });
      } catch (error) {
          console.error('Error al eliminar categoría:', error);
          return reply.status(500).send({ error: "Error al eliminar categoría" });
      }
    });

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
                create: imagenes, 
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
  
      for (let i = 6; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(now.getDate() - i);
          const iso = date.toISOString().slice(0, 10); 
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

    fastify.get('/opiniones', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) {
          return reply.status(401).send({ error: "No autenticado" });
      }

      try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const admin = await prisma.Cliente.findUnique({
              where: { email: decoded.email }
          });
          
          if (!admin || admin.rol !== 'Admin') {
              return reply.status(403).send({ error: "Acceso no autorizado" });
          }

          const { 
              page = 1, 
              limit = 10,
              search = '',
              minRating = '',
              maxRating = ''
          } = request.query;

          const where = {
              AND: [
                  search ? {
                      OR: [
                          { cliente: { nombre: { contains: search, mode: 'insensitive' } } },
                          { cliente: { apellidos: { contains: search, mode: 'insensitive' } } },
                          { cliente: { email: { contains: search, mode: 'insensitive' } } },
                          { producto: { nombre: { contains: search, mode: 'insensitive' } } },
                          { comentario: { contains: search, mode: 'insensitive' } }
                      ]
                  } : {},
                  minRating ? { calificacion: { gte: parseInt(minRating) } } : {},
                  maxRating ? { calificacion: { lte: parseInt(maxRating) } } : {}
              ].filter(cond => Object.keys(cond).length > 0)
          };

          const total = await prisma.Reseña.count({ where });

          const opiniones = await prisma.Reseña.findMany({
              where,
              include: {
                  cliente: {
                      select: {
                          nombre: true,
                          apellidos: true,
                          email: true
                      }
                  },
                  producto: {
                      select: {
                          nombre: true,
                          producto_id: true
                      }
                  }
              },
              skip: (page - 1) * limit,
              take: parseInt(limit),
              orderBy: {
                  fecha: 'desc'
              }
          });

          return reply.send({
              valoraciones: opiniones,
              pagination: {
                  total,
                  page: parseInt(page),
                  limit: parseInt(limit),
                  totalPages: Math.ceil(total / limit)
              }
          });
      } catch (error) {
          console.error('Error al obtener opiniones:', error);
          return reply.status(500).send({ error: "Error al obtener opiniones" });
      }
    });

    fastify.delete('/opiniones/:id', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) {
          return reply.status(401).send({ error: "No autenticado" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.cliente.findUnique({
          where: { email: decoded.email }
      });
      
      if (!admin || admin.rol !== 'Admin') {
          return reply.status(403).send({ error: "Acceso no autorizado" });
      }

      const { id } = request.params;

      try {
          await prisma.reseña.delete({
              where: { reseña_id: parseInt(id) }
          });

          return reply.send({ 
              message: 'Opinión eliminada correctamente'
          });
      } catch (error) {
          console.error('Error al eliminar opinión:', error);
          return reply.status(500).send({ error: "Error al eliminar opinión" });
      }
    });

    fastify.get('/admin/productos', async (request, reply) => {
      const token = request.cookies.token;
      if (!token) {
          return reply.status(401).send({ error: "No autenticado" });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const admin = await prisma.cliente.findUnique({
          where: { email: decoded.email }
      });
      
      if (!admin || admin.rol !== 'Admin') {
          return reply.status(403).send({ error: "Acceso no autorizado" });
      }

      const { 
          page = 1, 
          limit = 10,
          search = '',
          minPrice = '',
          maxPrice = '',
          category = '',
          sortField = 'producto_id',
          sortOrder = 'desc'
      } = request.query;

      const where = {
          AND: [
              search ? {
                  OR: [
                      { nombre: { contains: search, mode: 'insensitive' } },
                      { marca: { contains: search, mode: 'insensitive' } },
                      { descripcion: { contains: search, mode: 'insensitive' } }
                  ]
              } : {},
              minPrice ? { precio: { gte: parseFloat(minPrice) } } : {},
              maxPrice ? { precio: { lte: parseFloat(maxPrice) } } : {},
              category ? { categorias: { some: { categoria_id: parseInt(category) } } } : {}
          ].filter(cond => Object.keys(cond).length > 0)
      };

      try {
          const total = await prisma.producto.count({ where });

          const productos = await prisma.producto.findMany({
              where,
              include: {
                  imagenes: {
                      take: 1,
                      orderBy: { principal: 'desc' }
                  },
                  categorias: {
                      include: {
                          categoria: {
                              select: {
                                  nombre: true
                              }
                          }
                      }
                  }
              },
              skip: (page - 1) * limit,
              take: parseInt(limit),
              orderBy: {
                  [sortField]: sortOrder
              }
          });

          return reply.send({
              data: productos,
              pagination: {
                  total,
                  page: parseInt(page),
                  limit: parseInt(limit),
                  totalPages: Math.ceil(total / limit)
              }
          });
      } catch (error) {
          console.error('Error al obtener productos:', error);
          return reply.status(500).send({ error: "Error al obtener productos" });
      }
    });

fastify.delete('/admin/productos/:id', async (request, reply) => {
  const token = request.cookies.token;
  if (!token) {
      return reply.status(401).send({ error: "No autenticado" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const admin = await prisma.cliente.findUnique({
      where: { email: decoded.email }
  });
  
  if (!admin || admin.rol !== 'Admin') {
      return reply.status(403).send({ error: "Acceso no autorizado" });
  }

  const { id } = request.params;

  try {
      await prisma.productoCategoria.deleteMany({
          where: { producto_id: parseInt(id) }
      });

      await prisma.imagenProducto.deleteMany({
          where: { producto_id: parseInt(id) }
      });

      await prisma.reseña.deleteMany({
          where: { producto_id: parseInt(id) }
      });

      await prisma.detallePedido.deleteMany({
          where: { producto_id: parseInt(id) }
      });

      await prisma.producto.delete({
          where: { producto_id: parseInt(id) }
      });

      return reply.send({ 
          message: 'Producto eliminado correctamente'
      });
  } catch (error) {
      console.error('Error al eliminar producto:', error);
      return reply.status(500).send({ error: "Error al eliminar producto" });
  }
});

fastify.post('/admin/productos', async (request, reply) => {
  const token = request.cookies.token;
  if (!token) {
    return reply.status(401).send({ error: "No autenticado" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const admin = await prisma.cliente.findUnique({
    where: { email: decoded.email }
  });
  
  if (!admin || admin.rol !== 'Admin') {
    return reply.status(403).send({ error: "Acceso no autorizado" });
  }

  const { 
    nombre, 
    marca, 
    descripcion, 
    precio, 
    stock, 
    descuento = 0,
    categorias = [],
    imagenes = []
  } = request.body;

  try {
    if (imagenes.length > 0 && !imagenes.some(img => img.principal)) {
      return reply.status(400).send({ error: "Debe haber al menos una imagen principal" });
    }

    const producto = await prisma.producto.create({
      data: {
        nombre,
        marca,
        descripcion,
        precio,
        stock,
        descuento,
        categorias: {
          create: categorias.map(categoria_id => ({
            categoria: { connect: { categoria_id } }
          }))
        },
        imagenes: {
          create: imagenes.map(img => ({
            url: img.url,
            principal: img.principal || false
          }))
        }
      },
      include: {
        categorias: {
          include: {
            categoria: true
          }
        },
        imagenes: true
      }
    });

    return reply.send(producto);
  } catch (error) {
    console.error('Error al crear producto:', error);
    return reply.status(500).send({ error: "Error al crear producto" });
  }
});

fastify.put('/admin/productos/:id', async (request, reply) => {
  const token = request.cookies.token;
  if (!token) {
    return reply.status(401).send({ error: "No autenticado" });
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const admin = await prisma.cliente.findUnique({
    where: { email: decoded.email }
  });
  
  if (!admin || admin.rol !== 'Admin') {
    return reply.status(403).send({ error: "Acceso no autorizado" });
  }

  const productoId = parseInt(request.params.id);
  const { 
    nombre, 
    marca, 
    descripcion, 
    precio, 
    stock, 
    descuento = 0,
    categorias = [],
    imagenes = []
  } = request.body;

  try {
    if (imagenes.length > 0 && !imagenes.some(img => img.principal)) {
      return reply.status(400).send({ error: "Debe haber al menos una imagen principal" });
    }

    await prisma.productoCategoria.deleteMany({
      where: { producto_id: productoId }
    });

    await prisma.imagenProducto.deleteMany({
      where: { producto_id: productoId }
    });

    const producto = await prisma.producto.update({
      where: { producto_id: productoId },
      data: {
        nombre,
        marca,
        descripcion,
        precio,
        stock,
        descuento,
        categorias: {
          create: categorias.map(categoria_id => ({
            categoria: { connect: { categoria_id } }
          }))
        },
        imagenes: {
          create: imagenes.map(img => ({
            url: img.url,
            principal: img.principal || false
          }))
        }
      },
      include: {
        categorias: {
          include: {
            categoria: true
          }
        },
        imagenes: true
      }
    });

    return reply.send(producto);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return reply.status(500).send({ error: "Error al actualizar producto" });
  }
});

fastify.get('/admin/pedidos', async (request, reply) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.cliente.findUnique({
      where: { email: decoded.email }
    });

    if (!admin || admin.rol !== 'Admin') {
      return reply.status(403).send({ error: "Acceso no autorizado" });
    }

    const estado = request.query.estado;

    const pedidos = await prisma.pedido.findMany({
      where: estado ? { estado } : {},
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true
          }
        },
        direccion: true,
        detalle_pedido: {
          include: {
            producto: true
          }
        }
      },
      orderBy: {
        fecha_pedido: 'desc'
      }
    });

    return reply.send(pedidos);
  } catch (error) {
    return reply.status(500).send({ error: 'Error al obtener los pedidos', details: error.message });
  }
});

fastify.put('/admin/pedidos/:id/estado', async (request, reply) => {
  try {
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

      const { id } = request.params;
      const { estado } = request.body;

      const estadosValidos = ['pendiente', 'enviado', 'entregado', 'cancelado'];
      if (!estadosValidos.includes(estado)) {
          return reply.status(400).send({ error: 'Estado no válido' });
      }

      const estadoDetalleMap = {
        'pendiente': 'pendiente',
        'enviado': 'enviado',
        'entregado': 'entregado',
        'cancelado': 'cancelado'
      };
      const nuevoEstadoDetalle = estadoDetalleMap[estado];

      const [pedidoActualizado] = await prisma.$transaction([
        prisma.pedido.update({
          where: { pedido_id: parseInt(id) },
          data: { 
            estado,
            ...(estado === 'entregado' ? { fecha_recepcion: new Date() } : {})
          },
          include: {
            cliente: {
              select: {
                nombre: true,
                apellidos: true,
                email: true
              }
            },
            detalle_pedido: true
          }
        }),
        prisma.detallePedido.updateMany({
          where: { 
            pedido_id: parseInt(id),
          },
          data: {
            estado: nuevoEstadoDetalle
          }
        })
      ]);

      if (pedidoActualizado.cliente.email) {
        const datosCorreo = {
            numeroPedido: pedidoActualizado.pedido_id,
            estado: estado,
            nombreCliente: `${pedidoActualizado.cliente.nombre} ${pedidoActualizado.cliente.apellidos}`
        };
        
        emailActualizacionPedido(pedidoActualizado.cliente.email, datosCorreo)
            .catch(error => console.error('Error al enviar correo:', error));
      }

      return reply.send(pedidoActualizado);
  } catch (error) {
      return reply.status(400).send({ error: 'Error al actualizar el estado del pedido', details: error.message });
  }
});

fastify.get('/admin/pedidos/:id', async (request, reply) => {
  try {
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

      const { id } = request.params;

      const pedido = await prisma.pedido.findUnique({
          where: { pedido_id: parseInt(id) },
          include: {
              cliente: {
                  select: {
                      nombre: true,
                      apellidos: true,
                      email: true,
                      direccion: true,
                      telefono: true
                  }
              },
              detalle_pedido: {
                  include: {
                      producto: true
                  }
              }
          }
      });

      if (!pedido) {
          return reply.status(404).send({ error: 'Pedido no encontrado' });
      }

      return reply.send(pedido);
  } catch (error) {
      return reply.status(500).send({ error: 'Error al obtener el pedido', details: error.message });
  }
});

fastify.get('/admin/devoluciones', async (request, reply) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.cliente.findUnique({
      where: { email: decoded.email }
    });

    if (!admin || admin.rol !== 'Admin') {
      return reply.status(403).send({ error: "Acceso no autorizado" });
    }

    const pedidos = await prisma.pedido.findMany({
      where: {
        detalle_pedido: {
          some: {
            estado: {
              in: ['solicitada', 'devolución', 'devuelto', 'cancelado']
            }
          }
        }
      },
      include: {
        cliente: {
          select: {
            nombre: true,
            apellidos: true,
            email: true,
            telefono: true
          }
        },
        direccion: true,
        detalle_pedido: {
          where: {
            estado: {
              in: ['solicitada', 'devolución', 'devuelto', 'cancelado']
            }
          },
          include: {
            producto: {
              include: {
                imagenes: true
              }
            }
          }
        }
      },
      orderBy: {
        fecha_pedido: 'desc'
      }
    });

    return reply.send(pedidos);
  } catch (error) {
    return reply.status(500).send({ error: 'Error al obtener las devoluciones', details: error.message });
  }
});

fastify.put('/admin/devoluciones/:pedidoId/producto/:productoId', async (request, reply) => {
  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.cliente.findUnique({
      where: { email: decoded.email }
    });

    if (!admin || admin.rol !== 'Admin') {
      return reply.status(403).send({ error: "Acceso no autorizado" });
    }

    const { pedidoId, productoId } = request.params;
    const { estado } = request.body;

    const estadosPermitidos = ['solicitada', 'devolución', 'devuelto', 'cancelado'];
    if (!estadosPermitidos.includes(estado)) {
      return reply.status(400).send({ error: "Estado no válido para devolución" });
    }

    const detalleActual = await prisma.detallePedido.findUnique({
      where: {
        pedido_id_producto_id: {
          pedido_id: Number(pedidoId),
          producto_id: Number(productoId)
        }
      }
    });

    if (!detalleActual) {
      return reply.status(404).send({ error: "Producto no encontrado en el pedido" });
    }

    const transicionesValidas = {
      'solicitada': ['devolución', 'cancelado'],
      'devolución': ['devuelto', 'cancelado'],
      'devuelto': [], 
      'cancelado': [] 
    };

    if (!transicionesValidas[detalleActual.estado]?.includes(estado)) {
      return reply.status(400).send({ 
        error: `Transición no permitida de ${detalleActual.estado} a ${estado}`
      });
    }

    const detalleActualizado = await prisma.detallePedido.update({
      where: {
        pedido_id_producto_id: {
          pedido_id: Number(pedidoId),
          producto_id: Number(productoId)
        }
      },
      data: { estado },
      include: {
        producto: true,
        pedido: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (detalleActualizado.pedido.cliente.email && estado !== 'solicitada' && estado != 'cancelada') {
      const datosCorreo = {
          numeroPedido: pedidoId,
          estado: estado,
          nombreCliente: `${detalleActualizado.pedido.cliente.nombre} ${detalleActualizado.pedido.cliente.apellidos}`,
          nombreProducto: detalleActualizado.producto.nombre,
          precioProducto: detalleActualizado.precio_unitario
      };
      
      emailActualizacionDevolucion(detalleActualizado.pedido.cliente.email, datosCorreo)
          .catch(error => console.error('Error al enviar correo:', error));
    }


    return reply.send({ 
      mensaje: 'Estado de devolución actualizado correctamente',
      detalle: detalleActualizado
    });
  } catch (error) {
    return reply.status(500).send({ error: 'Error al actualizar la devolución', details: error.message });
  }
});

fastify.get('/logs', async (request, reply) => {
  const logFile = join(process.cwd(), 'logs', 'server.log');

  try {
    const token = request.cookies.token;
    if (!token) {
      return reply.status(401).send({ error: "No autenticado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.cliente.findUnique({
      where: { email: decoded.email }
    });

    if (!admin || admin.rol !== 'Admin') {
      return reply.status(403).send({ error: "Acceso no autorizado" });
    }

    const data = fs.readFileSync(logFile, 'utf-8');
    const lines = data.trim().split('\n');
    const logs = lines.map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        return { level: 'error', msg: 'Línea de log no válida', raw: line };
      }
    }).reverse();

    return logs;
  } catch (err) {
    request.log.error(`Error leyendo logs: ${err.message}`);
    reply.code(500).send({ error: 'No se pudieron leer los logs' });
  }
});
}