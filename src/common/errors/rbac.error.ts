import { ApplicationError } from '@distributed-social-platform/shared-kernel'

export class RoleNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'ROLE_NOT_FOUND'

  constructor() {
    super('Role not found')
  }
}

export class RoleAlreadyExistsError extends ApplicationError {
  readonly statusCode = 409
  readonly code = 'ROLE_ALREADY_EXISTS'

  constructor() {
    super('Role already exists')
  }
}

export class RoleInactiveError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'ROLE_INACTIVE'

  constructor() {
    super('Role is inactive')
  }
}

// Thrown when assigning a code that isn't in the SystemPermission catalog
// (shared-kernel) — the catalog IS the source of truth for valid codes now
// that there's no Permission table to check against.
export class InvalidPermissionCodeError extends ApplicationError {
  readonly statusCode = 400
  readonly code = 'INVALID_PERMISSION_CODE'

  constructor(code: string) {
    super(`Invalid permission code: ${code}`)
  }
}
