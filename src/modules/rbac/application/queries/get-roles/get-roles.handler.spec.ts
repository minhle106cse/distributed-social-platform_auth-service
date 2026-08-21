import { GetRolesHandler } from './get-roles.handler'
import { GetRolesQuery } from './get-roles.query'
import type { IRoleQueryRepository } from '@/modules/rbac/application/repositories/role.query-repository'

describe('GetRolesHandler', () => {
  let handler: GetRolesHandler
  let mockRoleQueryRepo: jest.Mocked<IRoleQueryRepository>

  beforeEach(() => {
    mockRoleQueryRepo = {
      getRoles: jest.fn(),
      getRoleByCode: jest.fn(),
    }

    handler = new GetRolesHandler(mockRoleQueryRepo)
  })

  it('should return all roles', async () => {
    const query = new GetRolesQuery()
    const roles = [
      {
        code: 'ADMIN',
        nameRole: 'Admin',
        description: null,
        createdAt: new Date(),
        permissions: [],
      },
    ]

    mockRoleQueryRepo.getRoles.mockResolvedValueOnce(roles)

    const result = await handler.execute(query)

    expect(mockRoleQueryRepo.getRoles).toHaveBeenCalled()
    expect(result).toEqual(roles)
  })
})
