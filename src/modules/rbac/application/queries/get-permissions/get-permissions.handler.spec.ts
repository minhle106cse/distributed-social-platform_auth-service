import { GetPermissionsHandler } from './get-permissions.handler'
import { GetPermissionsQuery } from './get-permissions.query'
import type { PermissionQueryRepository } from '@/modules/rbac/application/repositories/permission.query-repository'

describe('GetPermissionsHandler', () => {
  let handler: GetPermissionsHandler
  let mockPermissionQueryRepo: jest.Mocked<PermissionQueryRepository>

  beforeEach(() => {
    mockPermissionQueryRepo = {
      getPermissions: jest.fn(),
    }

    handler = new GetPermissionsHandler(mockPermissionQueryRepo)
  })

  it('should return all permissions', async () => {
    const query = new GetPermissionsQuery()
    const permissions = [
      { code: 'READ_POSTS', moduleName: 'POST', description: null, createdAt: new Date() },
    ]

    mockPermissionQueryRepo.getPermissions.mockResolvedValueOnce(permissions)

    const result = await handler.execute(query)

    expect(mockPermissionQueryRepo.getPermissions).toHaveBeenCalled()
    expect(result).toEqual(permissions)
  })
})
