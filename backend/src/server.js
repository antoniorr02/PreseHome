import Fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import routes from './routes/routes.js';
import fastifyCors from '@fastify/cors';

const prisma = new PrismaClient();
const fastify = Fastify();
console.log('Fastify instance created.');

fastify.register(fastifyCors, {
  origin: 'http://localhost:3000',
});
console.log('CORS configured.');

fastify.register(routes, { prisma });
console.log('Routes registered.');

const start = async () => {
  try {
    await fastify.listen({ port: 5000 });
    console.log('Servidor iniciado en http://localhost:5000');
  } catch (err) {
    console.error('Error al iniciar el servidor:', err);
    process.exit(1);
  }
};


start();
