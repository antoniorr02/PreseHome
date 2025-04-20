import fastifyOAuth2 from '@fastify/oauth2';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

export default async function (fastify, opts) {
  const { prisma } = opts;

  fastify.register(fastifyOAuth2, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID,
        secret: process.env.GOOGLE_CLIENT_SECRET
      },
      auth: fastifyOAuth2.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/auth/google',
    callbackUri: 'http://localhost:5000/auth/google/callback',
    scope: ['profile', 'email']
  });

  fastify.get('/auth/google/callback', async (req, reply) => {
    const tokenData = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

    const accessToken = tokenData.access_token || tokenData.token?.access_token;

    if (!accessToken) {
        console.error("No se pudo obtener access_token de tokenData:", tokenData);
        return reply.code(500).send({ error: "No se pudo obtener el token de acceso de Google." });
    }

    const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
        Authorization: `Bearer ${accessToken}`
    }
    }).then(res => res.json());

    const { email, given_name: nombre, family_name: apellidos } = userInfo;

    if (!email) {
      return reply.code(400).send({ error: "No se pudo obtener el email del usuario de Google." });
    }

    const user = await prisma.cliente.findUnique({
        where: { email },
    });

    let token;
    if (!user) {
        const hashedPassword = await bcrypt.hash(process.env.JWT_SECRET, 10);
        const nuevoCliente = await prisma.cliente.create({
            data: {
                nombre,
                apellidos,
                email,
                password: hashedPassword,
                confirmado: true,
                carrito: {
                    create: {}
                }
            },
            include: {
                carrito: true
            }
        });
        token = jwt.sign({ email: nuevoCliente.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        await prisma.cliente.update({
            where: { email: nuevoCliente.email },
            data: { token: token },
        });
    } else {
        token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        await prisma.cliente.update({
            where: { email: user.email },
            data: { token: token },
        });
    }

    reply.setCookie("token", token, {
        httpOnly: true,
        secure: false, // ARREGLAR EN PRODUCCIÓN
        sameSite: "Strict",
        path: "/",
        maxAge: 2 * 60 * 60,
    });

    reply.redirect('http://localhost:4321');
  });

  fastify.get('/profile', async (req, reply) => {
    const token = req.cookies.token;
    if (!token) return reply.status(401).send({ error: 'Not logged in' });

    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      reply.send(user);
    } catch {
      reply.status(401).send({ error: 'Invalid token' });
    }
  });
}
