import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes.js";
import fastifyCors from "@fastify/cors";
import contactRoutes from "./routes/contact.js";
import cron from "node-cron";
import fastifyCookie from "@fastify/cookie";
import { authenticate } from "./plugins/authMiddleware.js";
import userRoutes from "./routes/user.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import googleAuthRoutes from "./routes/googleAuth.js";
import carritoRoutes from "./routes/carrito.js";
import ratingRoutes from "./routes/rating.js";
import fs from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

// Configuración del transporte de logs para producción
const logTransports = process.env.NODE_ENV === "development" ? {
  target: "pino-pretty",
  options: { 
    colorize: true, 
    translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
    destination: 1, 
  }
} : {
  targets: [
    {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
        destination: 1 
      }
    },
    {
      target: 'pino/file',
      options: {
        destination: join(process.cwd(), 'logs', 'server.log'),
        mkdir: true
      }
    }
  ]
};

// Configuración de Fastify con Pino
const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    transport: logTransports,
    serializers: {
      req(request) {
        return {
          method: request.method,
          url: request.url,
          headers: request.headers
        };
      },
    },
  },
});

// Crear directorio de logs si no existe
if (!fs.existsSync(join(process.cwd(), 'logs'))) {
  fs.mkdirSync(join(process.cwd(), 'logs'));
}

fastify.log.info("Instancia de Fastify creada.");

// Configura CORS
fastify.register(fastifyCors, {
  origin: "http://localhost:4321",
  credentials: true,
});
fastify.log.info("CORS configurado para http://localhost:4321");

// Configura cookies
fastify.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
  hook: "onRequest",
});
fastify.log.info("Plugin de cookies registrado.");

// Middleware de autenticación
fastify.decorate("authenticate", authenticate);
fastify.log.info("Middleware de autenticación registrado.");

// Registro de rutas
fastify.register(routes, { prisma });
fastify.register(contactRoutes);
fastify.register(userRoutes, { prisma });
fastify.register(adminRoutes, { prisma });
fastify.register(authRoutes, { prisma });
fastify.register(googleAuthRoutes, { prisma });
fastify.register(carritoRoutes, { prisma });
fastify.register(ratingRoutes, { prisma });
fastify.log.info("Todas las rutas registradas.");

// Tarea CRON para eliminar cuentas no verificadas
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

    fastify.log.info(`${resultado.count} cuentas no verificadas eliminadas.`);
  } catch (error) {
    fastify.log.error(`Error eliminando cuentas no verificadas: ${error.message}`);
  }
});
fastify.log.info("Tarea CRON programada (ejecución cada 12 horas).");

// Iniciar servidor
const start = async () => {
  try {
    await fastify.listen({ port: 5000, host: "0.0.0.0" });
    fastify.log.info(`Servidor escuchando en http://localhost:5000`);
  } catch (err) {
    fastify.log.fatal(`Error al iniciar el servidor: ${err.message}`);
    process.exit(1);
  }
};

start();