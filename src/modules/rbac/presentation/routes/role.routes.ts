import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { HttpResponseBuilder } from '@distributed-social-platform/shared-kernel'
import { type Application } from '@/container/application'
import { CreateRoleCommand } from '@/modules/rbac/application/commands/create-role/create-role.command'
import { AssignRoleCommand } from '@/modules/rbac/application/commands/assign-role/assign-role.command'
import { AssignPermissionsCommand } from '@/modules/rbac/application/commands/assign-permissions/assign-permissions.command'
import { RevokeRoleCommand } from '@/modules/rbac/application/commands/revoke-role/revoke-role.command'
import { RevokePermissionsCommand } from '@/modules/rbac/application/commands/revoke-permissions/revoke-permissions.command'
import { DeleteRoleCommand } from '@/modules/rbac/application/commands/delete-role/delete-role.command'
import { GetRolesQuery } from '@/modules/rbac/application/queries/get-roles/get-roles.query'
import { GetRoleQuery } from '@/modules/rbac/application/queries/get-role/get-role.query'
import { 
  createRoleSchema, assignRoleSchema, assignPermissionsSchema, 
  getRolesSchema, getRoleSchema, deleteRoleSchema, revokeRoleSchema, revokePermissionsSchema,
  type CreateRoleBody, type AssignRoleBody, type AssignPermissionsBody, type AssignPermissionsParams,
  type GetRoleParams, type DeleteRoleParams, type RevokeRoleBody, type RevokePermissionsBody, type RevokePermissionsParams
} from '@/modules/rbac/presentation/schemas/role.schema'

interface RoleRouteOptions extends FastifyPluginOptions {
  commandBus: Application['commandBus']
  queryBus: Application['queryBus']
}

export function roleRoutes(fastify: FastifyInstance, options: RoleRouteOptions) {
  const { commandBus, queryBus } = options

  fastify.post<{ Body: CreateRoleBody }>(
    '/roles',
    {
      schema: {
        description: 'Create a new role',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...createRoleSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      const body = req.body
      const command = new CreateRoleCommand(body.code, body.nameRole, body.description)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Role created successfully', 201)
    },
  )

  fastify.post<{ Body: AssignRoleBody }>(
    '/roles/assign',
    {
      schema: {
        description: 'Assign role to a user',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...assignRoleSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      const body = req.body
      const command = new AssignRoleCommand(body.userId, body.roleCode)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Role assigned successfully', 200)
    },
  )

  fastify.post<{ Body: AssignPermissionsBody, Params: AssignPermissionsParams }>(
    '/roles/:code/permissions',
    {
      schema: {
        description: 'Assign permissions to a role',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...assignPermissionsSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      const body = req.body
      const params = req.params
      const command = new AssignPermissionsCommand(params.code, body.permissionCodes)
      const data = await commandBus.execute(command)
      return new HttpResponseBuilder(data, 'Permissions assigned successfully', 200)
    },
  )

  fastify.get(
    '/roles',
    {
      schema: {
        description: 'Get all roles',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...getRolesSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (_req, _reply) => {
      const data = await queryBus.execute(new GetRolesQuery())
      return new HttpResponseBuilder(data, 'Roles retrieved successfully', 200)
    },
  )

  fastify.get<{ Params: GetRoleParams }>(
    '/roles/:code',
    {
      schema: {
        description: 'Get a role by code',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...getRoleSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      const data = await queryBus.execute(new GetRoleQuery(req.params.code))
      return new HttpResponseBuilder(data, 'Role retrieved successfully', 200)
    },
  )

  fastify.delete<{ Params: DeleteRoleParams }>(
    '/roles/:code',
    {
      schema: {
        description: 'Delete a role',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...deleteRoleSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      await commandBus.execute(new DeleteRoleCommand(req.params.code))
      return new HttpResponseBuilder({ success: true }, 'Role deleted successfully', 200)
    },
  )

  fastify.delete<{ Body: RevokeRoleBody }>(
    '/roles/assign',
    {
      schema: {
        description: 'Revoke a role from a user',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...revokeRoleSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      await commandBus.execute(new RevokeRoleCommand(req.body.userId, req.body.roleCode))
      return new HttpResponseBuilder({ success: true }, 'Role revoked successfully', 200)
    },
  )

  fastify.delete<{ Body: RevokePermissionsBody, Params: RevokePermissionsParams }>(
    '/roles/:code/permissions',
    {
      schema: {
        description: 'Revoke permissions from a role',
        tags: ['rbac'],
        security: [{ cookieAuth: [] }],
        ...revokePermissionsSchema,
      },
      preHandler: [fastify.authenticate, fastify.requirePermissions(['RBAC:*'])],
    },
    async (req, _reply) => {
      await commandBus.execute(new RevokePermissionsCommand(req.params.code, req.body.permissionCodes))
      return new HttpResponseBuilder({ success: true }, 'Permissions revoked successfully', 200)
    },
  )
}
