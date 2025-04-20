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
  }
  