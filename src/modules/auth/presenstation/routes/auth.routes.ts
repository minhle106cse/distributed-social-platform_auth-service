import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { type UseCases } from '../../../../container/usecases'
import { type LoginCommand } from '../../application/commands/login.command'

interface AuthRouteOptions extends FastifyPluginOptions {
  auth: UseCases['auth']
}

export function authRoutes(fastify: FastifyInstance, options: AuthRouteOptions) {
  const { auth } = options

  fastify.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (req, reply) => {
      const { email, password } = req.body as LoginCommand

      const result = await auth.loginLocal.execute({
        email,
        password,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || null,
      })

      return reply.send(result)
    },
  )
}
