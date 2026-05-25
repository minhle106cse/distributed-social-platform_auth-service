import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from 'packages/shared-kernel';
import { type UseCases } from '../../../../container/usecases'
import type { LoginBody } from '../schemas/login.schema';
import { loginSchema } from '../schemas/login.schema'
import type { RegisterBody } from '../schemas/register.schema';
import { registerSchema } from '../schemas/register.schema';

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
      await auth.login.execute({ email, password })
      return new HttpResponseBuilder(null, 'Login successful', 200)
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
      await auth.register.execute({ email, password, fullName })
      return new HttpResponseBuilder(null, 'Registration successful', 201)
    },
  )
}
