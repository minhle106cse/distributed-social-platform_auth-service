import type { FastifyReply, FastifyRequest } from 'fastify'
import { /* ForbiddenError,  */ UnauthorizedError } from '../../errors/auth.error'

export function authorize(_roles: string[]) {
  return function (request: FastifyRequest, _reply: FastifyReply) {
    if (!request.user) {
      throw new UnauthorizedError()
    }

    /* if (!roles.includes(request.user.role)) {
      throw new ForbiddenError()
    } */
  }
}
