import { LogoutHandler } from './logout.handler'
import { LogoutCommand } from './logout.command'
import type { RefreshTokenRepository } from '@/modules/auth/domain/repositories/refresh-token.repository'
import type { TokenService } from '@/modules/auth/domain/services/token.service'
import { RefreshToken } from '@/modules/auth/domain/entities/refresh-token.entity'
import { RefreshTokenNotFoundError, ForbiddenError } from '@/common/errors/auth.error'

describe('LogoutHandler', () => {
  let handler: LogoutHandler
  let mockRefreshTokenRepository: jest.Mocked<RefreshTokenRepository>
  let mockTokenService: jest.Mocked<TokenService>

  beforeEach(() => {
    mockRefreshTokenRepository = {
      create: jest.fn(),
      findByTokenHash: jest.fn(),
      update: jest.fn(),
    } as any

    mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as any

    handler = new LogoutHandler(mockRefreshTokenRepository, mockTokenService)
  })

  it('should ignore if no refresh token is provided', async () => {
    const command = new LogoutCommand('user-1', undefined)
    await handler.execute(command)

    expect(mockTokenService.verifyRefreshToken).not.toHaveBeenCalled()
    expect(mockRefreshTokenRepository.findByTokenHash).not.toHaveBeenCalled()
  })

  it('should throw error if refresh token is invalid', async () => {
    const command = new LogoutCommand('user-1', 'invalid-token')
    mockTokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('Invalid token')
    })

    await expect(handler.execute(command)).rejects.toThrow('Invalid token')
    expect(mockRefreshTokenRepository.findByTokenHash).not.toHaveBeenCalled()
  })

  it('should throw RefreshTokenNotFoundError if token entity not found', async () => {
    const command = new LogoutCommand('user-1', 'valid-token')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(null)

    await expect(handler.execute(command)).rejects.toThrow(RefreshTokenNotFoundError)
    expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled()
  })

  it('should throw ForbiddenError if token belongs to another user', async () => {
    const command = new LogoutCommand('user-1', 'valid-token')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-1',
      userId: 'user-2',
      tokenHash: 'hash',
      expiredAt: new Date(),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValueOnce(tokenEntity)

    await expect(handler.execute(command)).rejects.toThrow(ForbiddenError)
    expect(mockRefreshTokenRepository.update).not.toHaveBeenCalled()
  })

  it('should revoke token if valid and belongs to the user', async () => {
    const command = new LogoutCommand('user-1', 'valid-token')
    mockTokenService.verifyRefreshToken.mockReturnValue('hash')

    const tokenEntity = RefreshToken.rehydrate({
      id: 'token-2',
      userId: 'user-1',
      tokenHash: 'hash',
      expiredAt: new Date(Date.now() + 10000),
      usedAt: null,
      revokedAt: null,
      ipAddress: null,
      userAgent: null,
    })

    // Spy on revoke method
    const revokeSpy = jest.spyOn(tokenEntity, 'revoke')
    mockRefreshTokenRepository.findByTokenHash.mockResolvedValue(tokenEntity)

    await handler.execute(command)

    expect(revokeSpy).toHaveBeenCalled()
    expect(mockRefreshTokenRepository.update).toHaveBeenCalledWith(tokenEntity)
  })
})
