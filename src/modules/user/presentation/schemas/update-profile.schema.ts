import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const updateProfileSchema = {
  body: z.object({
    firstName: z.string().trim().max(100).nullable().optional(),
    lastName: z.string().trim().max(100).nullable().optional(),
    displayName: z.string().trim().max(100).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    phoneNumber: z.string().trim().max(20).nullable().optional(),
  }),
  response: {
    200: createSuccessResponseSchema(
      z.object({
        success: z.boolean(),
      }),
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type UpdateProfileBody = z.infer<typeof updateProfileSchema.body>
