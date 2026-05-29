import { User } from './user.entity'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'
import { AuthMethodNotFoundError, UserCannotLoginError } from '@/errors/auth.error'
import { PasswordService } from '@/modules/auth/domain/services/password.service'
import { AuthMethod } from '@/modules/auth/domain/value-objects/auth-method.vo'

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'mock-uuid-v7')
}))

describe('User Entity', () => {
  let mockPasswordService: jest.Mocked<PasswordService>

  beforeEach(() => {
    mockPasswordService = {
      hash: jest.fn(),
      verify: jest.fn(),
    } as unknown as jest.Mocked<PasswordService>
  })

  describe('createForRegister', () => {
    it('should create a new user with local auth method and profile', async () => {
      mockPasswordService.hash.mockResolvedValue('hashed-password')

      const user = await User.createForRegister(
        { email: 'test@example.com', password: 'password123', fullName: 'Test User' },
        mockPasswordService,
      )

      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.isActive).toBe(true)
      expect(user.emailVerified).toBe(false)
      expect(mockPasswordService.hash).toHaveBeenCalledWith('password123')
      
      const authMethod = user.getAuthMethod(AuthProvider.LOCAL)
      expect(authMethod).toBeDefined()
      expect(authMethod.provider).toBe(AuthProvider.LOCAL)
      expect(authMethod.passwordHash).toBe('hashed-password')
    })
  })

  describe('ensureCanLogin', () => {
    it('should not throw if user is active', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        emailVerified: true,
        authMethods: [],
      })

      expect(() => user.ensureCanLogin()).not.toThrow()
    })

    it('should throw an error if user is inactive', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@example.com',
        isActive: false,
        emailVerified: true,
        authMethods: [],
      })

      expect(() => user.ensureCanLogin()).toThrow(UserCannotLoginError)
    })
  })

  describe('getAuthMethod', () => {
    it('should return the correct auth method if it exists', () => {
      const authMethod = AuthMethod.createForRegister('hash')
      const user = User.rehydrate({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        emailVerified: true,
        authMethods: [authMethod],
      })

      const method = user.getAuthMethod(AuthProvider.LOCAL)
      expect(method).toBe(authMethod)
    })

    it('should throw AuthMethodNotFoundError if it does not exist', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@example.com',
        isActive: true,
        emailVerified: true,
        authMethods: [],
      })

      expect(() => user.getAuthMethod(AuthProvider.LOCAL)).toThrow(AuthMethodNotFoundError)
    })
  })
})
