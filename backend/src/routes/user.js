import { authenticate } from '../plugins/authMiddleware.js';
import jwt from "jsonwebtoken";

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
        console.log('Cookies recibidas:', request.cookies);

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
          
          console.log(JSON.stringify(cliente, null, 2));

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
              total: total,
              detalle_pedido: {
                create: cliente.carrito.items.map(item => ({
                  producto_id: item.producto_id,
                  cantidad: item.cantidad,
                  precio_unitario: item.producto.precio
                }))
              },
              pedidos: {
                create: {
                  cliente_id: cliente.cliente_id
                }
              }
            },
            include: { detalle_pedido: true }
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
      
      
      
  }
  