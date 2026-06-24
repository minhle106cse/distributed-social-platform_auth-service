import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const logoutSchema = {
  response: {
    200: createSuccessResponseSchema(z.null()),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}
