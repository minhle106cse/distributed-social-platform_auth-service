import { type FastifyInstance, type FastifyPluginOptions } from 'fastify'
import { ApiResponse } from '@distributed-social-platform/shared-kernel'
import { type Application } from '@/container/application'
import { GetMeQuery } from '@/modules/user/application/queries/get-me/get-me.query'
import { UpdateProfileCommand } from '@/modules/user/application/commands/update-profile/update-profile.command'
import { getMeSchema } from '@/modules/user/presentation/schemas/get-me.schema'
import { updateProfileSchema, type UpdateProfileBody } from '@/modules/user/presentation/schemas/update-profile.schema'

interface UserRouteOptions extends FastifyPluginOptions {
  QueryBus: Application['QueryBus']
  CommandBus: Application['CommandBus']
}

export function userRoutes(fastify: FastifyInstance, options: UserRouteOptions) {
  const { QueryBus, CommandBus } = options

  fastify.get(
    '/me',
    {
      schema: {
        description: 'Get current user profile',
        tags: ['users'],
        security: [{ cookieAuth: [] }],
        ...getMeSchema,
      },
      preHandler: [fastify.authenticate],
    },
    async (req, _reply) => {
      const user = req.user
      const query = new GetMeQuery(user.id)
      const data = await QueryBus.execute(query)
      return new ApiResponse(data, 'User profile retrieved successfully', 200)
    },
  )

  fastify.put<{ Body: UpdateProfileBody }>(
    '/me/profile',
    {
      schema: {
        description: 'Update current user profile',
        tags: ['users'],
        security: [{ cookieAuth: [] }],
        ...updateProfileSchema,
      },
      preHandler: [fastify.authenticate],
    },
    async (req, _reply) => {
      const user = req.user
      const body = req.body
      const command = new UpdateProfileCommand(
        user.id,
        body.firstName,
        body.lastName,
        body.displayName,
        body.avatarUrl,
        body.phoneNumber
      )
      const result = await CommandBus.execute(command)
      return new ApiResponse(result, 'User profile updated successfully', 200)
    },
  )
}
