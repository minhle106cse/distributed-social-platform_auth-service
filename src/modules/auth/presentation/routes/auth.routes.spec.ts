import { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import { UseCases } from '@/container/usecases'

jest.setTimeout(30000)

describe('Auth Routes (Unit)', () => {
  let app: FastifyInstance
  
  // Mock the UseCases
  const mockAuthUsecases = {
    login: { execute: jest.fn() },
    register: { execute: jest.fn() },
    refresh: { execute: jest.fn() }
  } as unknown as UseCases['auth']

  beforeAll(async () => {
    app = await buildServer({ auth: mockAuthUsecases })
    await app.ready()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /auth/register', () => {
    it('should return 201 on successful registration', async () => {
      ;(mockAuthUsecases.register.execute as jest.Mock).mockResolvedValue(undefined)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        }
      })

      expect(response.statusCode).toBe(201)
      expect(mockAuthUsecases.register.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.success).toBe(true)
      expect(data.message).toBe('Registration successful')
    })

    it('should return 400 when validation fails (password too short)', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email: 'test@example.com',
          password: '123', // < 6 chars
          fullName: 'Test User'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(mockAuthUsecases.register.execute).not.toHaveBeenCalled()
    })
  })

  describe('POST /auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' }
      ;(mockAuthUsecases.login.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockAuthUsecases.login.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.success).toBe(true)
      expect(data.data.accessToken).toBe('access')
      expect(data.data.refreshToken).toBe('refresh')
    })
  })

  describe('POST /auth/refresh', () => {
    it('should return 200 on successful refresh', async () => {
      // Decode mock to bypass JWT check in handler
      app.jwt.decode = jest.fn().mockReturnValue({ sub: 'user1', email: 'test@example.com' })
      
      const mockTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' }
      ;(mockAuthUsecases.refresh.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockAuthUsecases.refresh.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.data.accessToken).toBe('new-access')
    })
  })
})
