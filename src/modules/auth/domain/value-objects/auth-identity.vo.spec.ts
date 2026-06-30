import { AuthIdentity } from './auth-identity.vo'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { InvalidAuthProviderError, InvalidCredentialsError } from '@/common/errors/auth.error'

describe('AuthIdentity Value Object', () => {
  const mockPasswordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('rehydrate', () => {
    it('should create AuthIdentity with undefined for null values', () => {
      const identity = AuthIdentity.rehydrate({
        provider: AuthProvider.GOOGLE,
        passwordHash: null,
        providerId: 'google-123',
      })
      expect(identity.provider).toBe(AuthProvider.GOOGLE)
      expect(identity.passwordHash).toBeUndefined()
      expect(identity.providerId).toBe('google-123')
    })

    it('should create AuthIdentity with provided values', () => {
      const identity = AuthIdentity.rehydrate({
        provider: AuthProvider.LOCAL,
        passwordHash: 'hashed-pass',
        providerId: null,
      })
      expect(identity.provider).toBe(AuthProvider.LOCAL)
      expect(identity.passwordHash).toBe('hashed-pass')
      expect(identity.providerId).toBeUndefined()
    })
  })

  describe('localAuthenticate', () => {
    it('should pass if password is correct', async () => {
      mockPasswordService.verify.mockResolvedValueOnce(true)
      const authIdentity = AuthIdentity.create('hashed-pass')

      await expect(
        authIdentity.localAuthenticate('plain-pass', mockPasswordService),
      ).resolves.not.toThrow()
    })

    it('should throw InvalidCredentialsError if password is incorrect', async () => {
      mockPasswordService.verify.mockResolvedValueOnce(false)
      const authIdentity = AuthIdentity.create('hashed-pass')

      await expect(
        authIdentity.localAuthenticate('wrong-pass', mockPasswordService),
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it('should throw InvalidAuthProviderError if provider is not LOCAL', async () => {
      const authIdentity = Object.create(AuthIdentity.prototype)
      Object.assign(authIdentity, { provider: AuthProvider.GOOGLE })

      await expect(authIdentity.localAuthenticate('pass', mockPasswordService)).rejects.toThrow(
        InvalidAuthProviderError,
      )
    })
  })
})
