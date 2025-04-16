import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {enviarCorreoConfirmacion} from '../scripts/emailConfirmacion.js'; 
import {emailCredencialesOlvidados} from '../scripts/emailCredencialesOlvidados.js'; 

export default async function (fastify, options) {
    const { prisma } = options

    fastify.post('/clientes', async (request, reply) => {
        const { nombre, apellidos, email, password } = request.body;
    
        try {
            const existingUser = await prisma.cliente.findUnique({ where: { email } });
            if (existingUser) {
                return reply.status(400).send({ error: 'El correo ya está en uso' });
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);
            const token_tmp = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "24h" });
    
            const nuevoCliente = await prisma.cliente.create({
                data: {
                    nombre,
                    apellidos,
                    email,
                    password: hashedPassword,
                    token: token_tmp,
                    carrito: {
                        create: {}
                    }
                },
                include: {
                    carrito: true
                }
            });
            await enviarCorreoConfirmacion(email, token_tmp);
            return reply.status(201).send({ message: 'Usuario registrado correctamente. Por favor, revisa tu correo para confirmar tu cuenta.' });
        } catch (error) {
            console.error('Error al generar el token:', error.message);
            return reply.status(500).send({ error: 'Error al registrar el cliente', details: error.message });
        }
      });

      fastify.post('/reenviar', async (request, reply) => {
          const { email } = request.body;
      
          if (!email) {
              return reply.status(400).send({ error: 'El correo es obligatorio' });
          }
      
          try {
              const cliente = await prisma.cliente.findUnique({ where: { email } });
      
              if (!cliente) {
                  return reply.status(404).send({ error: 'Usuario no encontrado' });
              }
      
              if (cliente.confirmado) {
                  return reply.status(400).send({ error: 'El usuario ya está confirmado' });
              }
      
              await enviarCorreoConfirmacion(cliente.email, cliente.token);
      
              return reply.send({ message: 'Correo de confirmación reenviado correctamente' });
          } catch (error) {
              console.error('Error al reenviar confirmación:', error);
              return reply.status(500).send({ error: 'Error interno del servidor' });
          }
        })
      
        fastify.post('/recuperar', async (request, reply) => {
          const { email } = request.body;
        
          if (!email) {
            return reply.status(400).send({ error: 'El correo es obligatorio' });
          }
        
          try {
            const cliente = await prisma.cliente.findUnique({ where: { email } });
        
            if (!cliente) {
              return reply.status(404).send({ error: 'No existe ninguna cuenta con ese correo' });
            }
            
            const token = jwt.sign({ email: cliente.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
                  
            await prisma.cliente.update({
              where: { email: cliente.email }, 
              data: { token: token },
            });
            await emailCredencialesOlvidados(cliente.email, token);
        
            return reply.send({ message: 'Correo de recuperación enviado correctamente' });
          } catch (error) {
            console.error('Error al enviar correo de recuperación:', error);
            return reply.status(500).send({ error: 'Error interno del servidor' });
          }
        });
      
      
        fastify.post('/restablecer-credenciales', async (request, reply) => {
          const { token, nuevaContrasena } = request.body;
      
          if (!token || !nuevaContrasena) {
              return reply.status(400).send({ error: "Token y nueva contraseña son obligatorios." });
          }
      
          try {
              const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verifica el token
              const email = decoded.email; // Obtén el correo del token
              const hashedPassword = await bcrypt.hash(nuevaContrasena, 10);
      
              // Cambiar la contraseña del usuario
              await prisma.cliente.update({
                  where: { email: email },
                  data: { password: hashedPassword },
              });
      
              return reply.send({ message: "Contraseña cambiada con éxito." });
          } catch (error) {
              return reply.status(401).send({ error: "Token inválido o expirado." });
          }
        });
        
      
      
        fastify.post("/confirmar", async (request, reply) => {
          const { token } = request.body;
      
          console.log('Token recibido:', token);
      
          try {
              const cliente = await prisma.cliente.findUnique({
                  where: { token },
              });
      
              if (!cliente) {
                  return reply.status(404).send({ success: false, error: "Usuario no encontrado" });
              }
      
              if (cliente.confirmado) {
                  return reply.status(400).send({ success: false, error: "La cuenta ya está confirmada" });
              }
      
              await prisma.cliente.update({
                  where: { token },
                  data: { confirmado: true },
              });
              
              const jwtToken = jwt.sign({ email: cliente.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
                      await prisma.cliente.update({
                  where: { email: cliente.email }, 
                  data: { token: jwtToken },
              });
              
              reply.setCookie("token", jwtToken, {
                  httpOnly: true, 
                  secure: false,
                  sameSite: "Strict",
                  path: "/",
                  maxAge: 2 * 60 * 60,
              });
      
              return reply.send({ 
                  success: true, 
                  message: "Cuenta confirmada exitosamente",
                  token: jwtToken
              });
          } catch (error) {
              console.error('Error al confirmar la cuenta:', error);
              return reply.status(400).send({ success: false, error: "No se ha podido confirmar la cuenta" });
          }
        })
      
        fastify.post('/login', async (request, reply) => {
          const { email, password } = request.body;
      
          const user = await prisma.cliente.findUnique({
            where: { email },
          });
      
          if (!user) {
              return reply.status(401).send({ error: 'Correo electrónico o contraseña incorrectos' });
          }
          
          if (!user.confirmado) {
              return reply.status(401).send({ error: 'Usuario no verificpasswordado' });
          }
          
          const match = await bcrypt.compare(password, user.password);
      
          if (!match) {
              return reply.status(401).send({ error: 'Correo electrónico o contraseña incorrectos' });
          }
      
          const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
          await prisma.cliente.update({
            where: { email: user.email }, 
            data: { token: token },
          });
      
          reply.setCookie("token", token, {
            httpOnly: true, 
            secure: false, //process.env.IN === "production",
            sameSite: "Strict",
            path: "/",
            maxAge: 2 * 60 * 60,
          });
      
          reply.send({ message: 'Inicio de sesión exitoso', token });
        })
}