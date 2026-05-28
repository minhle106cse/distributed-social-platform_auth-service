import { FastifyInstance } from 'fastify'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { jsonSchemaTransform } from 'fastify-type-provider-zod'

export async function setupSwagger(fastify: FastifyInstance) {
  await fastify.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'Auth Service API',
        description: 'Authentication Service',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  })

  await fastify.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  })
}
