import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import routes from "./routes/routes.js";
import fastifyCors from "@fastify/cors";
import contactRoutes from "./routes/contact.js";
import cron from "node-cron";

const prisma = new PrismaClient();
const fastify = Fastify();
console.log("Fastify instance created.");

fastify.register(fastifyCors, {
  origin: "*",
});
console.log("CORS configured.");

fastify.register(routes, { prisma });
fastify.register(contactRoutes);
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
