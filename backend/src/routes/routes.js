export default async function (fastify, options) {
    const { prisma } = options
  
    fastify.get('/clientes', async (request, reply) => {
      const clientes = await prisma.cliente.findMany()
      return reply.send(clientes)
    })
  
    fastify.get('/clientes/:id', async (request, reply) => {
      const { id } = request.params
      const cliente = await prisma.cliente.findUnique({
        where: { cliente_id: parseInt(id) },
      })
      if (!cliente) {
        return reply.status(404).send({ error: 'Cliente no encontrado' })
      }
      return reply.send(cliente)
    })
  
    fastify.post('/clientes', async (request, reply) => {
      const { nombre, apellidos, email, password } = request.body
      const nuevoCliente = await prisma.cliente.create({
        data: {
          nombre,
          apellidos,
          email,
          password, // TENGO QUE ENCRIPTAR (y añadir resto de campos)
        },
      })
      return reply.status(201).send(nuevoCliente)
    })
  
  }
  