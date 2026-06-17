import { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import { Application } from '@/container/application'

jest.setTimeout(30000)

describe('Auth Routes (Unit)', () => {
  let app: FastifyInstance
  
  // Mock the UseCases
  const mockCommandBus = {
    execute: jest.fn()
  } as unknown as Application['commandBus']

  const mockQueryBus = {
    execute: jest.fn()
  } as unknown as Application['queryBus']

  beforeAll(async () => {
    app = await buildServer({ commandBus: mockCommandBus, queryBus: mockQueryBus })
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
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser'
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
        url: '/api/v1/auth/register',
        payload: {
          email: 'test@example.com',
          password: '123', // < 6 chars
          username: 'testuser'
        }
      })

      expect(response.statusCode).toBe(400)
      expect(mockCommandBus.execute).not.toHaveBeenCalled()
    })
  })

  describe('POST /auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      const mockTokens = {
        accessToken: { token: 'access', expiredAt: new Date().toISOString() },
        refreshToken: { token: 'refresh', expiredAt: new Date().toISOString() }
      }
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123'
        }
      })

      if (response.statusCode !== 200) {
        console.log(response.body)
      }
      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.success).toBe(true)
      expect(data.data).toBeNull()
    })
  })

  describe('POST /auth/refresh', () => {
    it('should return 200 on successful refresh', async () => {
      // Decode mock to bypass JWT check in handler
      app.jwt.decode = jest.fn().mockReturnValue({ sub: 'user1', email: 'test@example.com' })
      
      const mockTokens = {
        accessToken: { token: 'new-access', expiredAt: new Date().toISOString() },
        refreshToken: { token: 'new-refresh', expiredAt: new Date().toISOString() }
      }
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token'
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.data).toBeNull()
    })

    it('should return 401 if refreshToken is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {}
      })
      expect(response.statusCode).toBe(401)
    })

    it('should return 401 if decoded payload has no sub', async () => {
      app.jwt.decode = jest.fn().mockReturnValue({ email: 'test@example.com' }) // no sub
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token'
        }
      })
      expect(response.statusCode).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)
      
      const token = app.jwt.sign({ sub: 'user123', email: 'test@example.com', roles: [], permissions: [] })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        cookies: {
          accessToken: token
        }
      })

      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
    })
  })


})
