import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { ApiResponse, SystemPermission } from '@distributed-social-platform/shared-kernel'
import { type Application } from '@/container/application'
import { GetPermissionsQuery } from '@/modules/rbac/application/queries/get-permissions/get-permissions.query'
import { getPermissionsSchema } from '@/modules/rbac/presentation/schemas/permission.schema'

interface PermissionRouteOptions extends FastifyPluginOptions {
  CommandBus: Application['CommandBus']
  QueryBus: Application['QueryBus']
}

// No POST here: permission codes are a fixed, code-defined catalog
// (SystemPermission in shared-kernel), not a runtime-creatable entity — see
// .ai/memory/architecture.jsonl 2026-07-08. Only Role is dynamic.
export function permissionRoutes(fastify: FastifyInstance, options: PermissionRouteOptions) {
  const { QueryBus } = options

  fastify.get(
    '/',
    {
      schema: {
        description: 'Get all permission codes (fixed catalog)',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...getPermissionsSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions([SystemPermission.RBAC_ALL])],
    },
    async (_req, _reply) => {
      const data = await QueryBus.execute(new GetPermissionsQuery())
      return new ApiResponse(data, 'Permissions retrieved successfully', 200)
    },
  )
}
