import { ApplicationError } from '@distributed-social-platform/shared-kernel'

export class ForbiddenError extends ApplicationError {
  readonly statusCode = 403
  readonly code = 'FORBIDDEN'

  constructor() {
    super('You do not have permission to access this resource')
  }
}

export class UnauthorizedError extends ApplicationError {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'

  constructor() {
    super('You are not authenticated')
  }
}

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
 
export class InvalidAuthProviderError extends ApplicationError {
  readonly statusCode = 400
  readonly code = 'INVALID_AUTH_PROVIDER'
  
  constructor() {
    super('Invalid auth provider')
  }
}

export class RefreshTokenNotFoundError extends ApplicationError {
  readonly statusCode = 404
  readonly code = 'REFRESH_TOKEN_NOT_FOUND'

  constructor() {
    super('Refresh token not found')
  }
}