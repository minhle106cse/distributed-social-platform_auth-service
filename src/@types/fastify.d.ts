import 'fastify';
import '@fastify/jwt';
import '@fastify/cookie';

declare module 'fastify' {
  interface FastifyRequest {
    startTime: bigint;
  }

  interface FastifyInstance {
    authenticate: any;
    authorize: any;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; email: string } // payload type is used for req.user
    user: {
      sub: string
      email: string
    } 
  }
}

export {};