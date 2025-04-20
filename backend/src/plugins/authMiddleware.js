import jwt from "jsonwebtoken";

export async function authenticate(request, reply) {
  try {
    const token = request.cookies.token;
    
    if (!token) {
      return reply.status(401).send({ error: "No autorizado" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    request.user = decoded;
  } catch (error) {
    console.error("Error de autenticación:", error.message);
    return reply.status(401).send({ error: "Token inválido o expirado" });
  }
}
