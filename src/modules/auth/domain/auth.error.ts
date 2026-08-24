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

export class RefreshTokenRevokedError extends ApplicationError {
  readonly statusCode = 401
  readonly code = 'REFRESH_TOKEN_REVOKED'

  constructor() {
    super('Refresh token has been revoked')
  }
}

export class RefreshTokenExpiredError extends ApplicationError {
  readonly statusCode = 401
  readonly code = 'REFRESH_TOKEN_EXPIRED'

  constructor() {
    super('Refresh token has expired')
  }
}

export class RefreshTokenUsedError extends ApplicationError {
  readonly statusCode = 401
  readonly code = 'REFRESH_TOKEN_USED'

  constructor() {
    super('Refresh token has been used')
  }
}
