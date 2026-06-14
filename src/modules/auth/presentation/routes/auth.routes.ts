import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from '@distributed-social-platform/shared-kernel'
import { type Application } from '@/container/application'
import type { LoginBody } from '@/modules/auth/presentation/schemas/login.schema'
import { loginSchema } from '@/modules/auth/presentation/schemas/login.schema'
import type { RegisterBody } from '@/modules/auth/presentation/schemas/register.schema'
import { registerSchema } from '@/modules/auth/presentation/schemas/register.schema'
import type { RefreshBody } from '@/modules/auth/presentation/schemas/refresh.schema'
import { refreshSchema } from '@/modules/auth/presentation/schemas/refresh.schema'
import { LoginCommand } from '@/modules/auth/application/commands/login/login.command'
import { RegisterCommand } from '@/modules/auth/application/commands/register/register.command'
import { RefreshCommand } from '@/modules/auth/application/commands/refresh/refresh.command'
import { LogoutCommand } from '@/modules/auth/application/commands/logout/logout.command'
import { GetMeQuery } from '@/modules/auth/application/queries/get-me/get-me.query'
import { UnauthorizedError } from '@/common/errors/auth.error'

interface AuthRouteOptions extends FastifyPluginOptions {
  commandBus: Application['commandBus']
  queryBus: Application['queryBus']
}

interface TokenResponse {
  accessToken: { token: string; expiredAt: Date | string | number }
  refreshToken: { token: string; expiredAt: Date | string | number }
  [key: string]: unknown
}

export function authRoutes(fastify: FastifyInstance, options: AuthRouteOptions) {
  const { commandBus, queryBus } = options

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
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '5 minutes'
        }
      }
    },
    async (req, reply) => {
      const { email, password } = req.body
      const command = new LoginCommand(email, password)
      const data = (await commandBus.execute(command)) as TokenResponse

      reply.setCookie('accessToken', data.accessToken.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(data.accessToken.expiredAt)
      })

      reply.setCookie('refreshToken', data.refreshToken.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(data.refreshToken.expiredAt)
      })

      // We remove the refreshToken from the response body for security
      const responsePayload = { ...(data as object) } as any
      delete responsePayload.refreshToken

      return new HttpResponseBuilder(responsePayload, 'Login successful', 200)
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
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '5 minutes'
        }
      }
    },
    async (req, _reply) => {
      const { email, password, username } = req.body
      const command = new RegisterCommand(email, password, username)
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
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute'
        }
      }
    },
    async (req, reply) => {
      // Prioritize HTTP-Only cookie, fallback to body
      const refreshToken = req.cookies.refreshToken || req.body?.refreshToken
      if (!refreshToken) {
        throw new UnauthorizedError()
      }

      const decoded = fastify.jwt.decode(refreshToken) as { sub: string; email: string } | null
      if (!decoded?.sub) {
        throw new UnauthorizedError()
      }

      const command = new RefreshCommand(refreshToken, decoded, req.body?.ipAddress, req.body?.userAgent)
      const data = (await commandBus.execute(command)) as TokenResponse

      reply.setCookie('accessToken', data.accessToken.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(data.accessToken.expiredAt)
      })

      reply.setCookie('refreshToken', data.refreshToken.token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(data.refreshToken.expiredAt)
      })

      const responsePayload = { ...(data as object) } as any
      delete responsePayload.refreshToken

      return new HttpResponseBuilder(responsePayload, 'Token refreshed successfully', 200)
    },
  )

  fastify.post(
    '/logout',
    {
      schema: {
        description: 'Logout current user',
        tags: ['auth'],
      },
      preHandler: [fastify.authenticate],
    },
    async (req, reply) => {
      const refreshToken = req.cookies.refreshToken
      const user = req.user as { sub: string }

      const command = new LogoutCommand(user.sub, refreshToken)
      await commandBus.execute(command)

      reply.clearCookie('accessToken', { path: '/' })
      reply.clearCookie('refreshToken', { path: '/' })
      return new HttpResponseBuilder(null, 'Logout successful', 200)
    },
  )

  fastify.get(
    '/me',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['auth'],
      },
      preHandler: [fastify.authenticate],
    },
    async (req, _reply) => {
      const user = req.user as { sub: string }
      const query = new GetMeQuery(user.sub)
      const data = await queryBus.execute(query)
      return new HttpResponseBuilder(data, 'User profile fetched successfully', 200)
    },
  )
}
