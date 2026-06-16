import { z } from 'zod'
import { ErrorResponseSchema, createSuccessResponseSchema } from '@distributed-social-platform/shared-kernel'

export const createRoleSchema = {
  body: z.object({
    code: z.string(),
    nameRole: z.string(),
    description: z.string().optional(),
  }),
  response: {
    201: createSuccessResponseSchema(
      z.object({
        id: z.string(),
        code: z.string(),
      })
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export const assignRoleSchema = {
  body: z.object({
    userId: z.string().uuid(),
    roleCode: z.string(),
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

export const assignPermissionsSchema = {
  body: z.object({
    permissionCodes: z.array(z.string()),
  }),
  params: z.object({
    code: z.string(),
  }),
  response: {
    200: createSuccessResponseSchema(
      z.object({
        id: z.string(),
        code: z.string(),
        permissions: z.array(z.string()),
      })
    ),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type CreateRoleBody = z.infer<typeof createRoleSchema.body>
export type AssignRoleBody = z.infer<typeof assignRoleSchema.body>
export type AssignPermissionsBody = z.infer<typeof assignPermissionsSchema.body>
export type AssignPermissionsParams = z.infer<typeof assignPermissionsSchema.params>

const roleDtoSchema = z.object({
  code: z.string(),
  nameRole: z.string(),
  description: z.string().nullable(),
  createdAt: z.date().or(z.string()),
  permissions: z.array(z.string()),
});

export const getRolesSchema = {
  response: {
    200: createSuccessResponseSchema(z.array(roleDtoSchema)),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export const getRoleSchema = {
  params: z.object({ code: z.string() }),
  response: {
    200: createSuccessResponseSchema(roleDtoSchema),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export const deleteRoleSchema = {
  params: z.object({ code: z.string() }),
  response: {
    200: createSuccessResponseSchema(z.object({ success: z.boolean() })),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export const revokeRoleSchema = {
  body: z.object({
    userId: z.string().uuid(),
    roleCode: z.string(),
  }),
  response: {
    200: createSuccessResponseSchema(z.object({ success: z.boolean() })),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export const revokePermissionsSchema = {
  body: z.object({
    permissionCodes: z.array(z.string()),
  }),
  params: z.object({
    code: z.string(),
  }),
  response: {
    200: createSuccessResponseSchema(z.object({ success: z.boolean() })),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    500: ErrorResponseSchema,
  },
}

export type GetRoleParams = z.infer<typeof getRoleSchema.params>
export type DeleteRoleParams = z.infer<typeof deleteRoleSchema.params>
export type RevokeRoleBody = z.infer<typeof revokeRoleSchema.body>
export type RevokePermissionsBody = z.infer<typeof revokePermissionsSchema.body>
export type RevokePermissionsParams = z.infer<typeof revokePermissionsSchema.params>
