import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string
      email: string
      roles: string[]
      permissions: string[]
    }

    user: {
      id: string
      email: string
      roles: string[]
      permissions: string[]
    }
  }
}
