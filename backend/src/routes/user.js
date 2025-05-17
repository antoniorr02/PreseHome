import { authenticate } from '../plugins/authMiddleware.js';
import jwt from "jsonwebtoken";
import {enviarCorreoFacturacion} from '../scripts/emailFactura.js'; 
import {enviarCorreoDevolucion} from '../scripts/emailDevolucion.js';

export default async function userRoutes(fastify, options) {
    const { prisma } = options

    fastify.post("/logout", { preHandler: [authenticate] }, async (request, reply) => {
        reply.clearCookie("token");
        reply.send({ message: "Sesión cerrada exitosamente" });
    })    

    fastify.get('/rol-sesion', async (request, reply) => {
        try {
            const token = request.cookies.token;
            if (!token) {
                return reply.status(401).send({ error: "No autenticado" });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const email = decoded.email;

            const user = await prisma.cliente.findUnique({
                where: { email },
            });

            if (!user) {
                return reply.status(401).send({ error: "Usuario no encontrado" });
            }

            return reply.send({ rol: user.rol });
        } catch (error) {
            console.error(error);
            return reply.status(401).send({ error: "No autenticado o token inválido" });
        }
    });

    fastify.get('/datos-cliente', { preHandler: [authenticate] }, async (request, reply) => {
        try {
          // Verificar el token en las cookies
          const token = request.cookies.token; // El token debería estar en las cookies
          if (!token) {
            return reply.status(401).send({ error: 'No autorizado' });
          }
      
          // Verificar y decodificar el token
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const email = decoded.email;
      
          // Buscar el cliente en la base de datos
          const cliente = await prisma.cliente.findUnique({
            where: { email },
            include: {
              direcciones: true,
              tarjetas: true,
            },
          });
      
          if (!cliente) {
            return reply.status(404).send({ error: 'Cliente no encontrado' });
          }
      
          // Responder con los datos del cliente
          return reply.send({
            cliente_id: cliente.cliente_id,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            email: cliente.email,
            dni: cliente.dni,
            telefono: cliente.telefono,
            direcciones: cliente.direcciones,
            tarjetas: cliente.tarjetas,
          });
        } catch (error) {
          console.error('Error al obtener los datos del cliente:', error);
          return reply.status(500).send({ error: 'Error al obtener los datos del cliente' });
        }
      });

      fastify.put('/clientes/:id',  { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const data = request.body;
      
        try {
          const clienteExistente = await prisma.cliente.findUnique({
            where: { cliente_id: parseInt(id) }
          });
      
          if (!clienteExistente) {
            return reply.status(404).send({ error: 'Cliente no encontrado' });
          }
      
          if (data.dni) {
            const letras = 'TRWAGMYFPDXBNJZSQVHLCKE';
            if (!/^\d{8}[A-Z]$/i.test(data.dni)) {
              return reply.status(400).send({ error: 'DNI no válido: formato incorrecto' });
            }
            const numero = parseInt(data.dni.substr(0, 8));
            const letra = data.dni.charAt(8).toUpperCase();
            const letraEsperada = letras[numero % 23];
            if (letra !== letraEsperada) {
              return reply.status(400).send({ error: 'DNI no válido: letra incorrecta' });
            }
          }
    
          if (data.email && data.email !== clienteExistente.email) {
            const token_tmp = jwt.sign({ email: data.email }, process.env.JWT_SECRET, { expiresIn: "24h" });
            data.token = token_tmp;
            data.confirmado = false;
            await enviarCorreoConfirmacion(data.email, token_tmp);
          }
      
          const clienteActualizado = await prisma.cliente.update({
            where: { cliente_id: parseInt(id) },
            data,
          });
      
          return reply.send(clienteActualizado);
        } catch (error) {
          return reply.status(400).send({ error: 'Error al actualizar el cliente', details: error.message });
        }
      });  
    
      fastify.post('/direccion/:cliente_id', { preHandler: [authenticate] }, async (request, reply) => {
        const { cliente_id } = request.params;
        const data = request.body;
      
        try {
          // Verificar si el cliente existe
          const clienteExistente = await prisma.cliente.findUnique({
            where: { cliente_id: parseInt(cliente_id) }
          });
      
          if (!clienteExistente) {
            return reply.status(404).send({ error: 'Cliente no encontrado' });
          }
      
          // Crear una nueva dirección asociada al cliente
          const nuevaDireccion = await prisma.direccion.create({
            data: {
              cliente_id: parseInt(cliente_id),
              calle: data.calle,
              numero: data.numero,
              piso: data.piso,
              ciudad: data.ciudad,
              cod_postal: data.cod_postal,
              pais: data.pais,
            },
          });
      
          return reply.send(nuevaDireccion);
        } catch (error) {
          return reply.status(400).send({ error: 'Error al agregar la dirección', details: error.message });
        }
      });

      fastify.put('/direccion/:direccion_id', { preHandler: [authenticate] }, async (request, reply) => {
        const { direccion_id } = request.params;
        const data = request.body;
      
        try {
          // Verificar si la dirección existe
          const direccionExistente = await prisma.direccion.findUnique({
            where: { direccion_id: parseInt(direccion_id) }
          });
      
          if (!direccionExistente) {
            return reply.status(404).send({ error: 'Dirección no encontrada' });
          }
      
          // Actualizar la dirección
          const direccionActualizada = await prisma.direccion.update({
            where: { direccion_id: parseInt(direccion_id) },
            data: {
              calle: data.calle,
              numero: data.numero,
              piso: data.piso,
              ciudad: data.ciudad,
              cod_postal: data.cod_postal,
              pais: data.pais,
            },
          });
      
          return reply.send(direccionActualizada);
        } catch (error) {
          return reply.status(400).send({ error: 'Error al modificar la dirección', details: error.message });
        }
      });      
    
      fastify.delete('/direccion/:id', { preHandler: [authenticate] }, async (request, reply) => {
        const { id } = request.params;
      
        try {
          const direccionEliminada = await prisma.direccion.delete({
            where: { direccion_id: parseInt(id) },
          });
      
          return reply.send(direccionEliminada);
        } catch (error) {
          return reply.status(400).send({ error: 'Error al eliminar la dirección', details: error.message });
        }
      });

      fastify.post('/tarjeta/:cliente_id', { preHandler: [authenticate] }, async (request, reply) => {
        const { cliente_id } = request.params;
        const data = request.body;
      
        try {
          const cliente = await prisma.cliente.findUnique({
            where: { cliente_id: parseInt(cliente_id) },
          });
      
          if (!cliente) {
            return reply.status(404).send({ error: 'Cliente no encontrado' });
          }
      
          const nuevaTarjeta = await prisma.tarjeta.create({
            data: {
              cliente_id: parseInt(cliente_id),
              numero: data.numero,
              titular: data.titular,
              caducidad: data.caducidad,
              cvv: data.cvv,
            },
          });
      
          return reply.send(nuevaTarjeta);
        } catch (error) {
          console.error(error);
          return reply.status(400).send({ error: 'Error al agregar la tarjeta', details: error.message });
        }
      });

      fastify.put('/tarjeta/:tarjeta_id', { preHandler: [authenticate] }, async (request, reply) => {
        const { tarjeta_id } = request.params;
        const data = request.body;
      
        try {
          const tarjeta = await prisma.tarjeta.findUnique({
            where: { tarjeta_id: parseInt(tarjeta_id) },
          });
      
          if (!tarjeta) {
            return reply.status(404).send({ error: 'Tarjeta no encontrada' });
          }
      
          const tarjetaActualizada = await prisma.tarjeta.update({
            where: { tarjeta_id: parseInt(tarjeta_id) },
            data,
          });
      
          return reply.send(tarjetaActualizada);
        } catch (error) {
          console.error(error);
          return reply.status(400).send({ error: 'Error al actualizar la tarjeta', details: error.message });
        }
      });
      
      fastify.delete('/tarjeta/:tarjeta_id', { preHandler: [authenticate] }, async (request, reply) => {
        const { tarjeta_id } = request.params;
      
        try {
          const tarjeta = await prisma.tarjeta.findUnique({
            where: { tarjeta_id: parseInt(tarjeta_id) },
          });
      
          if (!tarjeta) {
            return reply.status(404).send({ error: 'Tarjeta no encontrada' });
          }
      
          await prisma.tarjeta.delete({
            where: { tarjeta_id: parseInt(tarjeta_id) },
          });
      
          return reply.send({ mensaje: 'Tarjeta eliminada correctamente' });
        } catch (error) {
          console.error(error);
          return reply.status(400).send({ error: 'Error al eliminar la tarjeta', details: error.message });
        }
      });

      fastify.post('/confirmar-pago', { preHandler: [authenticate] }, async (request, reply) => {
        const direccion = request.body;
        try {
          const token = request.cookies.token;
          if (!token) {
            return reply.status(401).send({ error: 'No autorizado' });
          }
      
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          const email = decoded.email;
      
          const cliente = await prisma.cliente.findUnique({
            where: { email },
            include: {
              carrito: {
                include: {
                  items: {
                    include: {
                      producto: true
                    }
                  }
                }
              }
            }
          });
          
          if (!cliente || !cliente.carrito || cliente.carrito.items.length === 0) {
            return reply.status(400).send({ error: 'Carrito vacío o cliente no encontrado' });
          }
      
          const calcularPrecioConDescuento = (precio, descuento) => {
            return precio - (precio * descuento / 100);
          };
      
          const total = cliente.carrito.items.reduce((sum, item) => {
            const precio = item.producto.precio.toNumber();
            const descuento = item.producto.descuento || 0;
            const precioConDescuento = calcularPrecioConDescuento(precio, descuento);
            return sum + (precioConDescuento * item.cantidad);
          }, 0);
      
          const nuevoPedido = await prisma.pedido.create({
            data: {
              estado: 'pendiente',
              total,
              cliente: {
                connect: { cliente_id: cliente.cliente_id }
              },
              detalle_pedido: {
                create: cliente.carrito.items.map(item => ({
                  producto_id: item.producto_id,
                  cantidad: item.cantidad,
                  precio_unitario: item.producto.precio,
                  estado: 'pendiente'
                }))
              }
            },
            include: {
              detalle_pedido: {
                include: {
                  producto: true
                }
              },
              cliente: true
            }
          });
          
          await enviarCorreoFacturacion(email, direccion,{
            pedido: nuevoPedido,
            total: total,
          });

          await prisma.itemCarrito.deleteMany({
            where: {
              carrito_id: cliente.carrito.carrito_id
            }
          });
      
          return reply.send({ mensaje: 'Pedido confirmado y factura enviada.', pedido: nuevoPedido });
        } catch (error) {
          console.error(error);
          return reply.status(500).send({ error: 'Error al procesar el pedido', details: error.message });
        }
      });
      
      fastify.get('/pedidos-cliente', async (request, reply) => {
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
                where: { email: email }
            });
    
            if (!cliente) {
                return reply.status(401).send({ error: 'Debes iniciar sesión para ver tus pedidos.' });
            }
    
            const pedidos = await prisma.pedido.findMany({
                where: { cliente_id: cliente.cliente_id },
                include: {
                    detalle_pedido: {
                        include: {
                            producto: {
                                include: {
                                    imagenes: {
                                        where: { principal: true },
                                        take: 1
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    fecha_pedido: 'desc'
                }
            });       
            
            // Calcular precios con descuento para cada detalle
            const pedidosConDescuentos = pedidos.map(pedido => {
              const detallesConDescuento = pedido.detalle_pedido.map(detalle => {
                  const precioOriginal = parseFloat(detalle.precio_unitario);
                  const descuento = parseFloat(detalle.producto.descuento || 0);
                  const precioConDescuento = descuento > 0 
                      ? precioOriginal * (1 - descuento / 100)
                      : precioOriginal;
                  
                  return {
                      ...detalle,
                      precio_con_descuento: precioConDescuento.toFixed(2),
                      precio_original: precioOriginal.toFixed(2),
                      descuento_aplicado: descuento
                  };
              });

              return {
                      ...pedido,
                      detalle_pedido: detallesConDescuento
                  };
              });
    
            return reply.send({ pedidos: pedidosConDescuentos });
        } catch (err) {
            console.error('Error al obtener los pedidos del usuario:', err);
            reply.status(500).send({ error: 'Error al obtener datos.' });
        }
    });  
    
    fastify.put('/pedidos/:pedidoId/cancelar', { preHandler: [authenticate] }, async (request, reply) => {
      try {
          const { pedidoId } = request.params;
          const token = request.cookies.token;
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          // Verificar que el pedido pertenece al cliente
          const pedido = await prisma.pedido.findUnique({
              where: { pedido_id: parseInt(pedidoId) },
              include: { cliente: true }
          });
  
          if (!pedido || pedido.cliente.email !== decoded.email) {
              return reply.status(404).send({ error: 'Pedido no encontrado o no autorizado' });
          }
  
          // Solo se puede cancelar si está pendiente
          if (pedido.estado !== 'pendiente') {
              return reply.status(400).send({ error: 'Solo se pueden cancelar pedidos pendientes' });
          }
  
          // Actualizar el estado del pedido y sus detalles
          const updatedPedido = await prisma.pedido.update({
              where: { pedido_id: parseInt(pedidoId) },
              data: {
                  estado: 'cancelado',
                  detalle_pedido: {
                      updateMany: {
                          where: { pedido_id: parseInt(pedidoId) },
                          data: { estado: 'cancelado' }
                      }
                  }
              },
              include: {
                  detalle_pedido: true
              }
          });
  
          return reply.send({ mensaje: 'Pedido cancelado exitosamente', pedido: updatedPedido });
      } catch (error) {
          console.error(error);
          return reply.status(500).send({ error: 'Error al cancelar el pedido' });
      }
  });

  fastify.put('/pedidos/:pedidoId/productos/:productoId/devolver', { preHandler: [authenticate] }, async (request, reply) => {
    try {
        const { pedidoId, productoId } = request.params;
        const token = request.cookies.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar que el pedido pertenece al cliente
        const pedido = await prisma.pedido.findUnique({
            where: { pedido_id: parseInt(pedidoId) },
            include: {
                cliente: true,
                detalle_pedido: {
                    where: { producto_id: parseInt(productoId) },
                    include: { producto: true }
                }
            }
        });

        if (!pedido || pedido.cliente.email !== decoded.email) {
            return reply.status(404).send({ error: 'Pedido no encontrado o no autorizado' });
        }

        // Verificar que el producto existe en el pedido
        if (pedido.detalle_pedido.length === 0) {
            return reply.status(404).send({ error: 'Producto no encontrado en el pedido' });
        }

        const detalle = pedido.detalle_pedido[0];
        
        // Solo se puede devolver si está entregado y no ha pasado el plazo
        if (detalle.estado !== 'entregado') {
            return reply.status(400).send({ error: 'Solo se pueden devolver productos entregados' });
        }

        // Verificar plazo de devolución (15 días desde fecha_recepcion)
        if (pedido.fecha_recepcion) {
            const fechaRecepcion = new Date(pedido.fecha_recepcion);
            const hoy = new Date();
            const diferenciaDias = (hoy - fechaRecepcion) / (1000 * 60 * 60 * 24);
            
            if (diferenciaDias > 15) {
                return reply.status(400).send({ error: 'El plazo de devolución ha expirado (15 días desde recepción)' });
            }
        } else {
            return reply.status(400).send({ error: 'El pedido no ha sido marcado como recibido' });
        }

        // Actualizar el estado del producto en el pedido
        const updatedDetalle = await prisma.detallePedido.update({
            where: {
                pedido_id_producto_id: {
                    pedido_id: parseInt(pedidoId),
                    producto_id: parseInt(productoId)
                }
            },
            data: { estado: 'devolución' }
        });

        // Enviar correo electrónico con instrucciones de devolución
        await enviarCorreoDevolucion(
            pedido.cliente.email,
            {
                numeroPedido: pedido.pedido_id,
                producto: detalle.producto.nombre,
                fechaDevolucion: new Date().toLocaleDateString('es-ES')
            }
        );

        return reply.send({ 
            mensaje: 'Solicitud de devolución registrada. Por favor revise su correo electrónico para continuar con el proceso.', 
            detalle: updatedDetalle 
        });
    } catch (error) {
        console.error(error);
        return reply.status(500).send({ error: 'Error al procesar la devolución' });
    }
  });
      
}
  