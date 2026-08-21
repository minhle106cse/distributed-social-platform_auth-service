import type { FastifyInstance } from 'fastify'
import { SystemPermission } from '@distributed-social-platform/shared-kernel'
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

  describe('GET /api/v1/permissions', () => {
    it('should return 200 on successful fetch', async () => {
      ;(mockQueryBus.execute as jest.Mock).mockResolvedValue([])

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: [SystemPermission.RBAC_ALL],
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
