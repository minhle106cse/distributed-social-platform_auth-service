import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const refreshBodySchema = z.object({
  refreshToken: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export type RefreshBody = z.infer<typeof refreshBodySchema>

export const refreshSchema = {
  body: refreshBodySchema,
  response: {
    200: createSuccessResponseSchema(
      z.object({
        accessToken: z.object({
          token: z.string(),
          expiredAt: z.union([z.string(), z.number(), z.date()]),
        }),
      })
    ),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}