import { ApplicationError } from '@distributed-social-platform/shared-kernel'

export class UserNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'USER_NOT_FOUND'

  constructor() {
    super('User not found')
  }
}

export class UserAlreadyExistsError extends ApplicationError {
  readonly statusCode = 409
  readonly code = 'USER_ALREADY_EXISTS'
  constructor() {
    super('A user with the given email already exists')
  }
}

export class UserCannotLoginError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'USER_CANNOT_LOGIN'

  constructor() {
    super('User not allowed to authenticate')
  }
}

export class IdempotencyKeyConflictError extends ApplicationError {
  readonly statusCode = 409
  readonly code = 'IDEMPOTENCY_KEY_CONFLICT'

  constructor() {
    super('Idempotency key was already used for a different request')
  }
}
