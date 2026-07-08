import { ALL_SYSTEM_PERMISSIONS } from '@distributed-social-platform/shared-kernel'
import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetPermissionsQuery } from './get-permissions.query'
import type { PermissionDto } from '@/modules/rbac/application/queries/permission.dto'

// No DB lookup — SystemPermission (shared-kernel) is a fixed, code-defined
// catalog, not a runtime-editable entity. This just exposes it for the
// role-assignment UI (checkbox list of valid permission codes).
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  async execute(_query: GetPermissionsQuery): Promise<PermissionDto[]> {
    return ALL_SYSTEM_PERMISSIONS.map((code) => ({ code }))
  }
}
