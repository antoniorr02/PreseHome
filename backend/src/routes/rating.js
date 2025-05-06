import jwt from "jsonwebtoken";

async function ratingRoutes(fastify, options) {
    const { prisma } = options;
  
    fastify.post('/reseñas', async (request, reply) => {
      const { producto_id, calificacion, comentario } = request.body;
  
      if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
        return reply.status(400).send({ error: 'La calificación debe ser un número del 1 al 5.' });
      }
  
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
    
        if (!cliente) {
          return reply.status(401).send({ error: 'Debes iniciar sesión para valorar un producto.' });
        }
  
        const existente = await prisma.reseña.findFirst({
          where: {
            producto_id: producto_id,
            cliente_id: cliente.cliente_id,
          },
        });
  
        if (existente) {
          return reply.status(409).send({ error: 'Ya has valorado este producto.' });
        }
  
        const nueva = await prisma.reseña.create({
          data: {
            producto_id: producto_id,
            cliente_id: cliente.cliente_id,
            nombre_usuario: cliente.nombre,
            calificacion: calificacion,
            comentario: comentario,
          },
        });
  
        reply.send(nueva);
      } catch (err) {
        console.error('Error al guardar reseña:', err);
        reply.status(500).send({ error: 'Error al guardar reseña.' });
      }
    });
  
    fastify.get('/productos/:id/media-reseñas', async (request, reply) => {
      const { id } = request.params;
  
      try {
        const reseñas = await prisma.reseña.findMany({
          where: { producto_id: parseInt(id) },
          select: { calificacion: true },
        });
  
        if (reseñas.length === 0) {
          return reply.send({ media: 0, cantidad: 0 });
        }
  
        const total = reseñas.reduce((sum, r) => sum + r.calificacion, 0);
        const media = total / reseñas.length;
  
        reply.send({ media: Number(media.toFixed(2)), cantidad: reseñas.length });
      } catch (err) {
        console.error('Error al obtener media de reseñas:', err);
        reply.status(500).send({ error: 'Error al obtener datos.' });
      }
    });

    fastify.get('/valoraciones/:productoId', async (request, reply) => {
        const { productoId } = request.params;
      
        try {
          const valoraciones = await prisma.reseña.findMany({
            where: { producto_id: parseInt(productoId) },
            select: {
              nombre_usuario: true,
              calificacion: true,
              comentario: true,
            },
          });
          return reply.send({ valoraciones });
        } catch (error) {
          console.error(error);
          return reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });  
    
    fastify.get('/valoraciones-usuarios', async (request, reply) => {
    
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
        
            if (!cliente) {
              return reply.status(401).send({ error: 'Debes iniciar sesión para valorar un producto.' });
            }

            const valoraciones = await prisma.reseña.findMany({
                where: { cliente_id: cliente.cliente_id },
                select: {
                  reseña_id: true,
                  producto_id: true,
                  calificacion: true,
                  comentario: true,
                },
            });

            return reply.send({ valoraciones });
        } catch (err) {
            console.error('Error al obtener las reseñas del usuario:', err);
            reply.status(500).send({ error: 'Error al obtener datos.' });
        }
    });

    fastify.put('/reviews/:id', async (request, reply) => {
        const { id } = request.params;
        const { calificacion, comentario } = request.body;
    
        try {
          const review = await prisma.reseña.update({
            where: { reseña_id: parseInt(id) },
            data: {
              calificacion: calificacion,
              comentario: comentario,
            },
          });
    
          return reply.code(200).send(review);
        } catch (error) {
          console.error(error);
          return reply.code(500).send({ error: 'Error al actualizar la reseña.' });
        }
    });

    fastify.delete('/review/:reviewId', async (request, reply) => {
        const { reviewId } = request.params;
      
        try {
          const review = await prisma.reseña.findUnique({
            where: { reseña_id: parseInt(reviewId) },
          });
      
          if (!review) {
            return reply.status(404).send({ error: 'Reseña no encontrada' });
          }
      
          await prisma.reseña.delete({
            where: { reseña_id: parseInt(reviewId) },
          });
      
          reply.status(200).send({ message: 'Reseña eliminada correctamente' });
        } catch (error) {
          console.error('Error al eliminar la reseña:', error);
          reply.status(500).send({ error: 'Error al eliminar la reseña' });
        }
    });
      
  }
  
  export default ratingRoutes;
  