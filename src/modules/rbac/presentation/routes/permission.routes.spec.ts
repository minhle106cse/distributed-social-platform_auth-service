import type { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import type { Application } from '@/container/application'

jest.setTimeout(30000)

describe('Permission Routes (Unit)', () => {
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

  describe('POST /api/v1/permissions', () => {
    it('should return 201 on successful creation', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue({ id: 'p1', code: 'READ' })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/permissions',
        cookies: { accessToken: token },
        payload: { code: 'READ', moduleName: 'GLOBAL' },
      })

      expect(response.statusCode).toBe(201)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('GET /api/v1/permissions', () => {
    it('should return 200 on successful fetch', async () => {
      ;(mockQueryBus.execute as jest.Mock).mockResolvedValue([])

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/permissions',
        cookies: { accessToken: token },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
