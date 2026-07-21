import type { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import type { Application } from '@/container/application'

jest.setTimeout(30000)

describe('Auth Routes (Unit)', () => {
  let app: FastifyInstance

  // Mock the UseCases
  const mockCommandBus = {
    execute: jest.fn(),
  } as unknown as Application['CommandBus']

  const mockQueryBus = {
    execute: jest.fn(),
  } as unknown as Application['QueryBus']

  beforeAll(async () => {
    app = await buildServer({ CommandBus: mockCommandBus, QueryBus: mockQueryBus })
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
          username: 'testuser',
        },
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
          username: 'testuser',
        },
      })

      expect(response.statusCode).toBe(400)
      expect(mockCommandBus.execute).not.toHaveBeenCalled()
    })
  })

  describe('POST /auth/login', () => {
    it('should return 200 and tokens on successful login', async () => {
      const mockTokens = {
        accessToken: { token: 'access', expiredAt: new Date().toISOString() },
        refreshToken: { token: 'refresh', expiredAt: new Date().toISOString() },
      }
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: {
          email: 'test@example.com',
          password: 'password123',
        },
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
      // The route no longer decodes the JWT itself (fixed 2026-07-19 —
      // RefreshHandler now verifies the signature and reads sub/email from
      // that single verified call, see token.service.ts). CommandBus is
      // mocked below so there's nothing to stub at the route level anymore.
      const mockTokens = {
        accessToken: { token: 'new-access', expiredAt: new Date().toISOString() },
        refreshToken: { token: 'new-refresh', expiredAt: new Date().toISOString() },
      }
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(mockTokens)

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        payload: {
          refreshToken: 'valid-refresh-token',
        },
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
        payload: {},
      })
      expect(response.statusCode).toBe(401)
    })

    // An invalid/malformed refresh token (no `sub`, bad signature, etc.) is no
    // longer rejected by a route-level jwt.decode() check — RefreshHandler's
    // tokenService.verifyRefreshToken() now owns that validation (single
    // verified call, see refresh.handler.spec.ts for the handler-level
    // coverage of RefreshTokenNotFoundError/expired/used cases).
  })

  describe('POST /auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: [],
      })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/logout',
        cookies: {
          accessToken: token,
        },
      })

      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
    })
  })
})
