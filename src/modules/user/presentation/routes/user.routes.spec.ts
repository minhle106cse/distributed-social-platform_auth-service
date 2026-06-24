import type { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import type { Application } from '@/container/application'

jest.setTimeout(30000)

describe('User Routes (Unit)', () => {
  let app: FastifyInstance

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

  describe('GET /users/me', () => {
    it('should return 200 on successful fetch', async () => {
      ;(mockQueryBus.execute as jest.Mock).mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        isActive: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        roles: [],
        profile: null,
      })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: [],
      })
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me',
        cookies: {
          accessToken: token,
        },
      })
      if (response.statusCode !== 200) {
        console.log(response.body)
      }
      expect(response.statusCode).toBe(200)
      expect(mockQueryBus.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.data.email).toBe('test@example.com')
    })
  })

  describe('PUT /users/me/profile', () => {
    it('should return 200 on successful update', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue({ success: true })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: [],
      })
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/users/me/profile',
        cookies: {
          accessToken: token,
        },
        payload: {
          firstName: 'John',
          lastName: 'Doe',
        },
      })
      if (response.statusCode !== 200) {
        console.log(response.body)
      }
      expect(response.statusCode).toBe(200)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
      const data = response.json()
      expect(data.message).toBe('User profile updated successfully')
    })
  })
})
