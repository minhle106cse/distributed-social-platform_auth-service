import { ApplicationError } from '@distributed-social-platform/shared-kernel'

export class InvalidCredentialsError extends ApplicationError {
  readonly statusCode = 401
  readonly code = 'INVALID_CREDENTIALS'

  constructor() {
    super('Email or password is incorrect')
  }
}

export class UserCannotLoginError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'USER_CANNOT_LOGIN'

  constructor() {
    super('User not allowed to authenticate')
  }
}

export class AuthMethodNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'AUTH_METHOD_NOT_FOUND'

  constructor() {
    super('Auth method not found')
  }
}
