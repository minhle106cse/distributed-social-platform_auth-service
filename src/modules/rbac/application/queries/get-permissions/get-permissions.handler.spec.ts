import { GetPermissionsHandler } from './get-permissions.handler';
import { GetPermissionsQuery } from './get-permissions.query';
import { PermissionQueryRepository } from '@/modules/rbac/application/repositories/permission.query-repository';

describe('GetPermissionsHandler', () => {
  let handler: GetPermissionsHandler;
  let mockPermissionQueryRepo: jest.Mocked<PermissionQueryRepository>;

  beforeEach(() => {
    mockPermissionQueryRepo = {
      getPermissions: jest.fn(),
    } as unknown as jest.Mocked<PermissionQueryRepository>;

    handler = new GetPermissionsHandler(mockPermissionQueryRepo);
  });

  it('should return all permissions', async () => {
    const query = new GetPermissionsQuery();
    const permissions = [{ code: 'READ_POSTS', moduleName: 'POST', description: null, createdAt: new Date() }];

    mockPermissionQueryRepo.getPermissions.mockResolvedValueOnce(permissions);

    const result = await handler.execute(query);

    expect(mockPermissionQueryRepo.getPermissions).toHaveBeenCalled();
    expect(result).toEqual(permissions);
  });
});
