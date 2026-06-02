import { AuthMethodNotFoundError, UserCannotLoginError } from '@/common/errors/auth.error'
import { User } from './user.entity'
import { AuthIdentity } from '@/modules/auth/domain/value-objects/auth-identity.vo'
import { AuthProvider } from '@/modules/auth/domain/enums/auth-provider.enum'

describe('User Entity', () => {
  const mockPasswordService = {
    hash: jest.fn(),
    verify: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('createForRegister', () => {
    it('should create a new user with local auth identity', async () => {
      mockPasswordService.hash.mockResolvedValueOnce('hashed-password')

      const user = await User.createForRegister(
        { email: 'test@example.com', password: 'password' },
        mockPasswordService,
      )

      expect(user).toBeInstanceOf(User)
      expect(user.id).toBeDefined()
      expect(user.email).toBe('test@example.com')
      expect(user.isActive).toBe(true)
      expect(user.emailVerified).toBe(false)
      expect(user.getAuthIdentities).toHaveLength(1)

      const authIdentity = user.getAuthIdentity(AuthProvider.LOCAL)
      expect(authIdentity).toBeDefined()
      expect(authIdentity.provider).toBe(AuthProvider.LOCAL)
      expect(authIdentity.passwordHash).toBe('hashed-password')
    })
  })

  describe('ensureCanLogin', () => {
    it('should throw UserCannotLoginError if user is inactive', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@test.com',
        isActive: false,
        emailVerified: true,
        authIdentities: [],
      })
      expect(() => user.ensureCanLogin()).toThrow(UserCannotLoginError)
    })

    it('should not throw if user is active', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@test.com',
        isActive: true,
        emailVerified: true,
        authIdentities: [],
      })
      expect(() => user.ensureCanLogin()).not.toThrow()
    })
  })

  describe('getAuthIdentity', () => {
    it('should return the correct auth identity if it exists', () => {
      const authIdentity = AuthIdentity.createForRegister('hash')
      const user = User.rehydrate({
        id: '1',
        email: 'test@test.com',
        isActive: true,
        emailVerified: true,
        authIdentities: [authIdentity],
      })

      const identity = user.getAuthIdentity(AuthProvider.LOCAL)
      expect(identity).toBe(authIdentity)
    })

    it('should throw AuthMethodNotFoundError if it does not exist', () => {
      const user = User.rehydrate({
        id: '1',
        email: 'test@test.com',
        isActive: true,
        emailVerified: true,
        authIdentities: [],
      })

      expect(() => user.getAuthIdentity(AuthProvider.LOCAL)).toThrow(AuthMethodNotFoundError)
    })
  })
})
