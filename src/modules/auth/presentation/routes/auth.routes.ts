import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from '@distributed-social-platform/shared-kernel'
import { type UseCases } from '@/container/usecases'
import type { LoginBody } from '@/modules/auth/presentation/schemas/login.schema'
import { loginSchema } from '@/modules/auth/presentation/schemas/login.schema'
import type { RegisterBody } from '@/modules/auth/presentation/schemas/register.schema'
import { registerSchema } from '@/modules/auth/presentation/schemas/register.schema'
import type { RefreshBody } from '@/modules/auth/presentation/schemas/refresh.schema'
import { refreshSchema } from '@/modules/auth/presentation/schemas/refresh.schema'
import { LoginCommand } from '@/modules/auth/application/commands/login/login.command'
import { RegisterCommand } from '@/modules/auth/application/commands/register/register.command'
import { RefreshCommand } from '@/modules/auth/application/commands/refresh/refresh.command'
import { UnauthorizedError } from '@/common/errors/auth.error'

interface AuthRouteOptions extends FastifyPluginOptions {
  commandBus: UseCases['commandBus']
}

export function authRoutes(fastify: FastifyInstance, options: AuthRouteOptions) {
  const { commandBus } = options

  fastify.post<{
    Body: LoginBody
  }>(
    '/login',
    {
      schema: {
        description: 'Login to the application',
        tags: ['auth'],
        ...loginSchema,
      },
    },
    async (req, _reply) => {
      const { email, password } = req.body
      const command = new LoginCommand(email, password)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Login successful', 200)
    },
  )

  fastify.post<{
    Body: RegisterBody
  }>(
    '/register',
    {
      schema: {
        description: 'Register a new user',
        tags: ['auth'],
        ...registerSchema,
      },
    },
    async (req, _reply) => {
      const { email, password, fullName } = req.body
      const command = new RegisterCommand(email, password, fullName)
      await commandBus.execute(command)
      return new HttpResponseBuilder(null, 'Registration successful', 201)
    },
  )

  fastify.post<{
    Body: RefreshBody
  }>(
    '/refresh',
    {
      schema: {
        description: 'Refresh access token',
        tags: ['auth'],
        ...refreshSchema,
      },
    },
    async (req, _reply) => {
      const { refreshToken, ipAddress, userAgent } = req.body
      const decoded = fastify.jwt.decode(refreshToken) as { sub: string; email: string } | null

      if (!decoded?.sub) {
        throw new UnauthorizedError()
      }

      const command = new RefreshCommand(refreshToken, decoded, ipAddress, userAgent)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Token refreshed successfully', 200)
    },
  )
}
