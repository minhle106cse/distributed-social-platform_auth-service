import type { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '@/common/errors/auth.error'

export function requirePermissions(permissions: string[]) {
  return function (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) {
    if (!request.user) {
      return done(new UnauthorizedError())
    }

    const hasPermission = permissions.every(p => request.user.permissions?.includes(p))
    if (!hasPermission) {
      return done(new ForbiddenError())
    }

    done()
  }
}
