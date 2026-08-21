import { ALL_SYSTEM_PERMISSIONS } from '@distributed-social-platform/shared-kernel'
import type { IQueryHandler } from '@distributed-social-platform/shared-kernel'
import type { GetPermissionsQuery } from './get-permissions.query'
import type { PermissionDto } from '@/modules/rbac/application/queries/permission.dto'

// No DB lookup — SystemPermission (shared-kernel) is a fixed, code-defined
// catalog, not a runtime-editable entity. This just exposes it for the
// role-assignment UI (checkbox list of valid permission codes).
export class GetPermissionsHandler implements IQueryHandler<GetPermissionsQuery> {
  // Implements IQueryHandler.execute, whose signature is Promise<T>; this query answers
  // from a compile-time constant list, so there is genuinely no I/O to await.
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(_query: GetPermissionsQuery): Promise<PermissionDto[]> {
    return ALL_SYSTEM_PERMISSIONS.map((code) => ({ code }))
  }
}
