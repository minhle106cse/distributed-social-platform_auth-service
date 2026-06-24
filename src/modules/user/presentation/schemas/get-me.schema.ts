import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const getMeSchema = {
  response: {
    200: createSuccessResponseSchema(
      z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        isActive: z.boolean(),
        emailVerified: z.boolean(),
        createdAt: z.union([z.string(), z.date()]),
        roles: z.array(z.string()),
        profile: z
          .object({
            firstName: z.string().nullable(),
            lastName: z.string().nullable(),
            displayName: z.string().nullable(),
            avatarUrl: z.string().nullable(),
            phoneNumber: z.string().nullable(),
          })
          .nullable(),
      }),
    ),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}
