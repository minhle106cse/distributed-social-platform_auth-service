import { z } from 'zod'
import {
  ErrorResponseSchema,
  createSuccessResponseSchema,
} from '@distributed-social-platform/shared-kernel'

export const getPermissionsSchema = {
  response: {
    200: createSuccessResponseSchema(z.array(z.object({ code: z.string() }))),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}
