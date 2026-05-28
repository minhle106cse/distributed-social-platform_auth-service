import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const refreshBodySchema = z.object({
  refreshToken: z.string(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

export type RefreshBody = z.infer<typeof refreshBodySchema>

export const refreshSchema = {
  body: refreshBodySchema,
  response: {
    200: createSuccessResponseSchema(
      z.object({
        accessToken: z.string(),
        refreshToken: z.string(),
      })
    ),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}