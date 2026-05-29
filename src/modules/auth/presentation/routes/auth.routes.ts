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
import { UnauthorizedError } from '@/errors/auth.error'

interface AuthRouteOptions extends FastifyPluginOptions {
  auth: UseCases['auth']
}

export function authRoutes(fastify: FastifyInstance, options: AuthRouteOptions) {
  const { auth } = options

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
      const data = await auth.login.execute(new LoginCommand(email, password))
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
      await auth.register.execute(new RegisterCommand(email, password, fullName))
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

      const data = await auth.refresh.execute(
        new RefreshCommand(refreshToken, ipAddress, userAgent),
        decoded,
      )
      return new HttpResponseBuilder(data, 'Token refreshed successfully', 200)
    },
  )
}
