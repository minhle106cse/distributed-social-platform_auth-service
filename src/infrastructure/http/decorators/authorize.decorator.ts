import type { FastifyReply, FastifyRequest } from 'fastify'
import { ForbiddenError, UnauthorizedError } from '@/common/errors/auth.error'

// Wildcard matching theo AWS IAM style:
//   '*'          — global wildcard, pass mọi thứ
//   'rbac:*'     — resource wildcard, pass mọi action trên resource 'rbac'
//   'rbac:read'  — exact match
function matchesPermission(granted: string, required: string): boolean {
  if (granted === '*') return true
  if (granted === required) return true

  const colonIdx = granted.indexOf(':')
  if (colonIdx !== -1 && granted.endsWith(':*')) {
    const requiredColonIdx = required.indexOf(':')
    if (requiredColonIdx === -1) return false
    const grantedResource = granted.slice(0, colonIdx)
    const requiredResource = required.slice(0, requiredColonIdx)
    return grantedResource === requiredResource
  }

  return false
}

export function requirePermissions(required: string[]) {
  return function (request: FastifyRequest, _reply: FastifyReply, done: (err?: Error) => void) {
    if (!request.user) {
      return done(new UnauthorizedError())
    }

    const granted = request.user.permissions ?? []
    const hasAll = required.every(req => granted.some(g => matchesPermission(g, req)))
    if (!hasAll) {
      return done(new ForbiddenError())
    }

    done()
  }
}
