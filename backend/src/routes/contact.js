import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export default async function contactRoutes(fastify, options) {
  fastify.post("/contact", async (request, reply) => {
    const { name, email, message } = request.body;

    if (!name || !email || !message) {
      return reply.status(400).send({ error: "Todos los campos son obligatorios." });
    }

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"${name}" <${email}>`,
        to: process.env.RECIPIENT_EMAIL,
        subject: "Nuevo mensaje de contacto",
        text: `Nombre: ${name}\nEmail: ${email}\nMensaje:\n${message}`,
      });

      reply.status(200).send({ message: "Correo enviado correctamente." });
    } catch (error) {
      console.error("Error al enviar el correo:", error);
      reply.status(500).send({ error: "Error al enviar el mensaje." });
    }
  });
}
