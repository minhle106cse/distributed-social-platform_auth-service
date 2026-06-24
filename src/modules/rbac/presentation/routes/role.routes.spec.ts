import type { FastifyInstance } from 'fastify'
import { buildServer } from '@/bootstrap/server'
import type { Application } from '@/container/application'

jest.setTimeout(30000)

describe('Role Routes (Unit)', () => {
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

  describe('POST /api/v1/roles', () => {
    it('should return 201 on successful creation', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue({ id: 'r1', code: 'ADMIN' })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/roles',
        cookies: { accessToken: token },
        payload: { code: 'ADMIN', nameRole: 'Admin' },
      })

      expect(response.statusCode).toBe(201)
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1)
    })
  })

  describe('POST /api/v1/roles/assign', () => {
    it('should return 200 on successful assignment', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue({ success: true })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/roles/assign',
        cookies: { accessToken: token },
        payload: { userId: '123e4567-e89b-12d3-a456-426614174000', roleCode: 'ADMIN' },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('POST /api/v1/roles/:code/permissions', () => {
    it('should return 200 on successful permission assignment', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue({
        id: 'r1',
        code: 'ADMIN',
        permissions: ['READ'],
      })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/roles/ADMIN/permissions',
        cookies: { accessToken: token },
        payload: { permissionCodes: ['READ'] },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('GET /api/v1/roles', () => {
    it('should return 200 on successful fetch', async () => {
      ;(mockQueryBus.execute as jest.Mock).mockResolvedValue([
        {
          code: 'ADMIN',
          nameRole: 'Admin',
          description: null,
          createdAt: new Date().toISOString(),
          permissions: [],
        },
      ])

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/roles',
        cookies: { accessToken: token },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('GET /api/v1/roles/:code', () => {
    it('should return 200 on successful fetch', async () => {
      ;(mockQueryBus.execute as jest.Mock).mockResolvedValue({
        code: 'ADMIN',
        nameRole: 'Admin',
        description: null,
        createdAt: new Date().toISOString(),
        permissions: [],
      })

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/roles/ADMIN',
        cookies: { accessToken: token },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('DELETE /api/v1/roles/:code', () => {
    it('should return 200 on successful delete', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/roles/ADMIN',
        cookies: { accessToken: token },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('DELETE /api/v1/roles/assign', () => {
    it('should return 200 on successful revoke', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/roles/assign',
        cookies: { accessToken: token },
        payload: { userId: '123e4567-e89b-12d3-a456-426614174000', roleCode: 'ADMIN' },
      })

      expect(response.statusCode).toBe(200)
    })
  })

  describe('DELETE /api/v1/roles/:code/permissions', () => {
    it('should return 200 on successful permission revoke', async () => {
      ;(mockCommandBus.execute as jest.Mock).mockResolvedValue(undefined)

      const token = app.jwt.sign({
        sub: 'user123',
        email: 'test@example.com',
        roles: [],
        permissions: ['rbac:*'],
      })
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/roles/ADMIN/permissions',
        cookies: { accessToken: token },
        payload: { permissionCodes: ['READ'] },
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
