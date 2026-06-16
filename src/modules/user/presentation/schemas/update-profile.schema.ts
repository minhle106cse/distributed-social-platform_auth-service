import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const updateProfileSchema = {
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    displayName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    phoneNumber: z.string().optional(),
  }),
  response: {
    200: createSuccessResponseSchema(
      z.object({
        success: z.boolean(),
      })
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type UpdateProfileBody = z.infer<typeof updateProfileSchema.body>
