import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from '@distributed-social-platform/shared-kernel'
import { type Application } from '@/container/application'
import { CreatePermissionCommand } from '@/modules/rbac/application/commands/create-permission/create-permission.command'
import { GetPermissionsQuery } from '@/modules/rbac/application/queries/get-permissions/get-permissions.query'
import { createPermissionSchema, getPermissionsSchema, type CreatePermissionBody } from '@/modules/rbac/presentation/schemas/permission.schema'

interface PermissionRouteOptions extends FastifyPluginOptions {
  commandBus: Application['commandBus']
  queryBus: Application['queryBus']
}

export function permissionRoutes(fastify: FastifyInstance, options: PermissionRouteOptions) {
  const { commandBus, queryBus } = options

  fastify.post<{ Body: CreatePermissionBody }>(
    '/',
    {
      schema: {
        description: 'Create a new permission',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...createPermissionSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      const body = req.body
      const command = new CreatePermissionCommand(body.code, body.moduleName, body.description)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Permission created successfully', 201)
    },
  )

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all permissions',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...getPermissionsSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (_req, _reply) => {
      const data = await queryBus.execute(new GetPermissionsQuery())
      return new HttpResponseBuilder(data, 'Permissions retrieved successfully', 200)
    },
  )
}
