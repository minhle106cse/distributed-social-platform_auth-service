import 'fastify'
import '@fastify/jwt'
import '@fastify/cookie'

declare module 'fastify' {
  interface FastifyRequest {
    startTime: bigint
  }

  interface FastifyInstance {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authenticate: any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    requirePermissions: (permissions: string[]) => any
  }
}

export {}
