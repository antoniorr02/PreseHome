import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";

dotenv.config();
const fastify = Fastify({ logger: true });

fastify.register(cors, {
  origin: "*",
});

fastify.get("/", async () => {
  return { message: "API funcionando 🚀" };
});

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
