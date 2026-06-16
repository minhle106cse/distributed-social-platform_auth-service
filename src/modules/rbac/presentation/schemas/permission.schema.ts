import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const createPermissionSchema = {
  body: z.object({
    code: z.string(),
    moduleName: z.string(),
    description: z.string().optional(),
  }),
  response: {
    201: createSuccessResponseSchema(
      z.object({
        id: z.string(),
        code: z.string(),
      })
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type CreatePermissionBody = z.infer<typeof createPermissionSchema.body>

export const getPermissionsSchema = {
  response: {
    200: createSuccessResponseSchema(z.array(z.object({
      code: z.string(),
      moduleName: z.string(),
      description: z.string().nullable(),
      createdAt: z.date().or(z.string()),
    }))),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}
