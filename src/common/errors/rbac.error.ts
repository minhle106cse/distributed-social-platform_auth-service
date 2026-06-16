import { ApplicationError } from '@distributed-social-platform/shared-kernel'

export class RoleNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'ROLE_NOT_FOUND'

  constructor() {
    super('Role not found')
  }
}

export class PermissionNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'PERMISSION_NOT_FOUND'

  constructor() {
    super('Permission not found')
  }
}
