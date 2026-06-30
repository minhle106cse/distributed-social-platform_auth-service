import { LoginHandler } from './login.handler'
import type { UserRepository } from '@/modules/user/domain/repositories/user.repository'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { PasswordService } from '@/modules/auth/domain/services/password.service'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { InvalidCredentialsError } from '@/common/errors/auth.error'
import { UserCannotLoginError } from '@/common/errors/user.error'
import { User } from '@/modules/user/domain/entities/user.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7'),
}))
jest.mock('@/modules/auth/domain/entities/refresh-token.entity')

describe('LoginHandler', () => {
  let handler: LoginHandler
  let mockUserRepo: jest.Mocked<UserRepository>
  let mockRefreshTokenRepo: jest.Mocked<RefreshTokenRepository>
  let mockPasswordService: jest.Mocked<PasswordService>
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    mockUserRepo = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    }

    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    } as unknown as jest.Mocked<RefreshTokenRepository>

    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    }

    mockTokenService = {
      signAccessToken: jest.fn(),
      signRefreshToken: jest.fn(),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>

    handler = new LoginHandler(
      mockUserRepo,
      mockRefreshTokenRepo,
      mockPasswordService,
      mockTokenService,
    )
  })

  it('should successfully login and return tokens', async () => {
    // Setup Mock User
    const authIdentity = AuthIdentity.create('hashed-pass')
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [authIdentity],
    })

    // Mock user repo finding user
    mockUserRepo.findByEmail.mockResolvedValue(user)

    // Mock password comparison (must be true)
    mockPasswordService.verify.mockResolvedValue(true)

    // Mock RefreshToken creation
    const mockRefreshTokenEntity = { expiredAt: new Date(Date.now() + 10000) } as RefreshToken
    ;(RefreshToken.create as jest.Mock).mockReturnValue({
      refreshToken: 'mock-refresh-token',
      refreshTokenEntity: mockRefreshTokenEntity,
    })

    // Mock AccessToken generation
    mockTokenService.signAccessToken.mockReturnValue({
      token: 'mock-access-token',
      expiredAt: new Date(Date.now() + 5000),
    })

    const result = await handler.execute({
      email: 'test@example.com',
      password: 'plain-pass',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    } as any)

    // Assertions
    expect(mockUserRepo.findByEmail).toHaveBeenCalledWith('test@example.com', true)
    expect(mockPasswordService.verify).toHaveBeenCalledWith('plain-pass', 'hashed-pass')
    expect(mockRefreshTokenRepo.create).toHaveBeenCalledWith(mockRefreshTokenEntity)
    expect(mockTokenService.signAccessToken).toHaveBeenCalledWith({
      sub: 'user-id',
      email: 'test@example.com',
      roles: [],
      permissions: [],
    })

    expect(result.accessToken.token).toBe('mock-access-token')
    expect(result.refreshToken.token).toBe('mock-refresh-token')
  })

  it('should throw InvalidCredentialsError if user is not found', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null)

    await expect(
      handler.execute({
        email: 'notfound@example.com',
        password: 'pass',
      } as any),
    ).rejects.toThrow(InvalidCredentialsError)
  })

  it('should throw if user is inactive', async () => {
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: false, // Inactive!
      emailVerified: true,
      authIdentities: [],
    })

    mockUserRepo.findByEmail.mockResolvedValue(user)

    await expect(
      handler.execute({
        email: 'test@example.com',
        password: 'pass',
      } as any),
    ).rejects.toThrow(UserCannotLoginError)
  })

  it('should auto-restore user if they were soft-deleted', async () => {
    const authIdentity = AuthIdentity.create('hashed-pass')
    const user = User.rehydrate({
      id: 'user-id',
      email: 'test@example.com',
      isActive: true,
      emailVerified: true,
      authIdentities: [authIdentity],
      deletedAt: new Date(), // Soft deleted
    })

    mockUserRepo.findByEmail.mockResolvedValue(user)
    mockPasswordService.verify.mockResolvedValue(true)
    mockUserRepo.save.mockResolvedValue()
    ;(RefreshToken.create as jest.Mock).mockReturnValue({
      refreshToken: 'mock-refresh-token',
      refreshTokenEntity: { expiredAt: new Date() } as RefreshToken,
    })

    mockTokenService.signAccessToken.mockReturnValue({ token: 'access', expiredAt: new Date() })

    await handler.execute({
      email: 'test@example.com',
      password: 'plain-pass',
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
    } as any)

    expect(user.isDeleted()).toBe(false)
    expect(mockUserRepo.save).toHaveBeenCalledWith(user)
  })
})
