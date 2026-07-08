import { ALL_SYSTEM_PERMISSIONS } from '@distributed-social-platform/shared-kernel'
import { GetPermissionsHandler } from './get-permissions.handler'
import { GetPermissionsQuery } from './get-permissions.query'

describe('GetPermissionsHandler', () => {
  it('returns the full SystemPermission catalog', async () => {
    const handler = new GetPermissionsHandler()

    const result = await handler.execute(new GetPermissionsQuery())

    expect(result).toEqual(ALL_SYSTEM_PERMISSIONS.map((code) => ({ code })))
  })
})
