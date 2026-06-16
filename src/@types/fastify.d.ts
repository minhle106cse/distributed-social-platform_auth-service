import 'fastify';
import '@fastify/jwt';
import '@fastify/cookie';

declare module 'fastify' {
  interface FastifyRequest {
    startTime: bigint;
  }

  interface FastifyInstance {
    authenticate: any;
    requirePermissions: (permissions: string[]) => any;
  }
}

export {};