import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const registerBodySchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(6).max(128),
  username: z.string().trim().min(2).max(50),
})

export type RegisterBody = z.infer<typeof registerBodySchema>

export const registerSchema = {
  body: registerBodySchema,
  response: {
    201: createSuccessResponseSchema(z.null()),
    400: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}
