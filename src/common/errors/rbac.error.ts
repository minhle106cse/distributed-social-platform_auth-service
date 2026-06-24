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

export class RoleAlreadyExistsError extends ApplicationError {
  readonly statusCode = 409
  readonly code = 'ROLE_ALREADY_EXISTS'

  constructor() {
    super('Role already exists')
  }
}

export class PermissionAlreadyExistsError extends ApplicationError {
  readonly statusCode = 409
  readonly code = 'PERMISSION_ALREADY_EXISTS'

  constructor() {
    super('Permission already exists')
  }
}

export class RoleInactiveError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'ROLE_INACTIVE'

  constructor() {
    super('Role is inactive')
  }
}

export class PermissionInactiveError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'PERMISSION_INACTIVE'

  constructor() {
    super('Permission is inactive')
  }
}
