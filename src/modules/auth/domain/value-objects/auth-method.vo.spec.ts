import { AuthMethod } from './auth-method.vo'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { InvalidCredentialsError, InvalidAuthProviderError } from '@/errors/auth.error'
import { PasswordService } from '@/modules/auth/domain/services/password.service'

describe('AuthMethod Value Object', () => {
  let mockPasswordService: jest.Mocked<PasswordService>

  beforeEach(() => {
    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>
  })

  describe('localAuthenticate', () => {
    it('should resolve if password matches', async () => {
      const authMethod = AuthMethod.createForRegister('hashed-pass')
      mockPasswordService.verify.mockResolvedValue(true)

      await expect(
        authMethod.localAuthenticate('plain-pass', mockPasswordService)
      ).resolves.not.toThrow()
      
      expect(mockPasswordService.verify).toHaveBeenCalledWith('plain-pass', 'hashed-pass')
    })

    it('should throw InvalidCredentialsError if password does not match', async () => {
      const authMethod = AuthMethod.createForRegister('hashed-pass')
      mockPasswordService.verify.mockResolvedValue(false)

      await expect(
        authMethod.localAuthenticate('wrong-pass', mockPasswordService)
      ).rejects.toThrow(InvalidCredentialsError)
    })

    it('should throw Error if not a local provider', async () => {
      const authMethod = Object.create(AuthMethod.prototype)
      Object.assign(authMethod, { provider: AuthProvider.GOOGLE })

      await expect(
        authMethod.localAuthenticate('pass', mockPasswordService)
      ).rejects.toThrow(InvalidAuthProviderError)
    })
  })
})
