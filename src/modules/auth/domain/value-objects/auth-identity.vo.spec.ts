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

  describe('localAuthenticate', () => {
    it('should pass if password is correct', async () => {
      mockPasswordService.verify.mockResolvedValueOnce(true)
      const authIdentity = AuthIdentity.createForRegister('hashed-pass')

      await expect(
        authIdentity.localAuthenticate('plain-pass', mockPasswordService),
      ).resolves.not.toThrow()
    })

    it('should throw InvalidCredentialsError if password is incorrect', async () => {
      mockPasswordService.verify.mockResolvedValueOnce(false)
      const authIdentity = AuthIdentity.createForRegister('hashed-pass')

      await expect(
        authIdentity.localAuthenticate('wrong-pass', mockPasswordService),
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it('should throw InvalidAuthProviderError if provider is not LOCAL', async () => {
      const authIdentity = Object.create(AuthIdentity.prototype)
      Object.assign(authIdentity, { provider: AuthProvider.GOOGLE })

      await expect(
        authIdentity.localAuthenticate('pass', mockPasswordService),
      ).rejects.toThrow(InvalidAuthProviderError)
    })
  })
})
