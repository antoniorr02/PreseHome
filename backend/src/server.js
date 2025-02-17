import Fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import routes from './routes/routes.js';

const prisma = new PrismaClient();
const fastify = Fastify();

fastify.register(routes, { prisma });

const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log("Servidor en http://localhost:5000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
