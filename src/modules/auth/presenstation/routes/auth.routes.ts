import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from 'packages/shared-kernel'
import { type UseCases } from '../../../../container/usecases'
import type { LoginBody } from '../schemas/login.schema'
import { loginSchema } from '../schemas/login.schema'
import type { RegisterBody } from '../schemas/register.schema'
import { registerSchema } from '../schemas/register.schema'
import type { RefreshBody } from '../schemas/refresh.schema'
import { refreshSchema } from '../schemas/refresh.schema'
import { LoginCommand } from '../../application/commands/login/login.command'
import { RegisterCommand } from '../../application/commands/register/register.command'
import { RefreshCommand } from '../../application/commands/refresh/refresh.command'
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
      schema: loginSchema,
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
      schema: registerSchema,
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
      schema: refreshSchema,
    },
    async (req, _reply) => {
      const { refreshToken, ipAddress, userAgent } = req.body
      const decoded = fastify.jwt.decode(refreshToken) as { sub: string, email: string }
      const data = await auth.refresh.execute(
        new RefreshCommand(refreshToken, ipAddress, userAgent),
        decoded,
      )
      return new HttpResponseBuilder(data, 'Token refreshed successfully', 200)
    },
  )
}
