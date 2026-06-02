import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type LoginBody = z.infer<typeof loginBodySchema>

export const loginSchema = {
  body: loginBodySchema,
  response: {
    200: createSuccessResponseSchema(
      z.object({
        accessToken: z.object({
          token: z.string(),
          expiredAt: z.union([z.string(), z.number(), z.date()]),
        }),
        refreshToken: z.object({
          token: z.string(),
          expiredAt: z.union([z.string(), z.number(), z.date()]),
        }),
      })
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}
