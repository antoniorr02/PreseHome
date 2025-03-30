import { authenticate } from '../plugins/authMiddleware.js';
import jwt from "jsonwebtoken";

export default async function userRoutes(fastify, options) {
    const { prisma } = options
    fastify.addHook('onRequest', authenticate);

    // RUTAS A PROTEGER CON SESIÓN
    fastify.post("/logout", async (request, reply) => {
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
    })   
  }
  