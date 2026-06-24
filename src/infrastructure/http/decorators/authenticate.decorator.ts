import type { FastifyJWT } from '@fastify/jwt'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { UnauthorizedError } from '@/common/errors/auth.error'

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  try {
    const jwtPayload: FastifyJWT['payload'] = await request.jwtVerify()
    const user: FastifyJWT['user'] = {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      roles: jwtPayload.roles,
      permissions: jwtPayload.permissions,
    }

    request.user = user
  } catch {
    throw new UnauthorizedError()
  }
}
