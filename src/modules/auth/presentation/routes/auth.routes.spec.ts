import { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import { UseCases } from '@/container/usecases'

jest.setTimeout(30000)

describe('Auth Routes (Unit)', () => {
  let app: FastifyInstance
  
  // Mock the UseCases
  const mockCommandBus = {
    execute: jest.fn()
  } as unknown as UseCases['commandBus']

  beforeAll(async () => {
    app = await buildServer({ commandBus: mockCommandBus })
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
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)

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
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
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
      expect(mockCommandBus.execute).not.toHaveBeenCalled()
    })
  })

  describe('POST /auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      const mockTokens = { accessToken: 'access', refreshToken: 'refresh' }
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
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
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.data.accessToken).toBe('new-access')
    })
  })
})
