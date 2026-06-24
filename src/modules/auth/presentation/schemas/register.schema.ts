import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(2),
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
