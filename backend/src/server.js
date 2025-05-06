import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes.js";
import fastifyCors from "@fastify/cors";
import contactRoutes from "./routes/contact.js";
import cron from "node-cron";
import fastifyCookie from "@fastify/cookie";
import { authenticate } from "./plugins/authMiddleware.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js"
import authRoutes from "./routes/auth.js"
import googleAuthRoutes from "./routes/googleAuth.js";
import carritoRoutes from "./routes/carrito.js";
import ratingRoutes from "./routes/rating.js";

const prisma = new PrismaClient();
const fastify = Fastify();
console.log("Fastify instance created.");

// Configura CORS
fastify.register(fastifyCors, {
  origin: "http://localhost:4321", // Cambia según tu frontend
  credentials: true,
});
console.log("CORS configured.");

// Configura cookies
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
  hook: "onRequest",
});

// Registra el middleware de autenticación
fastify.decorate("authenticate", authenticate);

// Registra las rutas
fastify.register(routes, { prisma });
fastify.register(contactRoutes);
fastify.register(userRoutes, { prisma });
fastify.register(adminRoutes, { prisma });
fastify.register(authRoutes, { prisma });
fastify.register(googleAuthRoutes, { prisma });
fastify.register(carritoRoutes, { prisma });
fastify.register(ratingRoutes, { prisma });
console.log("Routes registered.");

// Eliminar cuentas no verificadas después de 24 horas
cron.schedule("0 */12 * * *", async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setHours(fechaLimite.getHours() - 24);

    const resultado = await prisma.Cliente.deleteMany({
      where: {
        confirmado: false,
        fecha_registro: { lt: fechaLimite },
      },
    });

    console.log(`Cuentas eliminadas: ${resultado.count}`);
  } catch (error) {
    console.error("Error eliminando cuentas no verificadas:", error);
  }
});

console.log("Tarea cron programada para eliminar cuentas no verificadas cada 12 horas.");

const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log("Servidor iniciado en http://localhost:5000");
  } catch (err) {
    console.error("Error al iniciar el servidor:", err);
    process.exit(1);
  }
};

start();
