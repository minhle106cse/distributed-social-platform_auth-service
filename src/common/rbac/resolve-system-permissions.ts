import { ALL_SYSTEM_PERMISSIONS } from '@distributed-social-platform/shared-kernel'
import { SystemRole } from './system-rbac'

/** The shape both callers already have on hand: a user's roles, each with its codes. */
export interface RoleWithPermissions {
  code: string
  permissions: string[]
}

/**
 * THE rule for turning a user's system roles into their effective permissions.
 * SUPER_ADMIN is implicit-all (it deliberately has no `role_permissions` rows —
 * see system-rbac.ts); every other role contributes its own list, de-duplicated.
 *
 * SINGLE SOURCE OF TRUTH, and that is the entire reason this function exists
 * rather than the rule being inlined at each call site. It has exactly two
 * consumers and they MUST agree: `UserMapper.toDomain` (which decides what goes
 * into the JWT at mint time) and `ResolveSystemPermissionsHandler` (which
 * answers core-api's per-request gRPC lookup). If those two ever disagree, a
 * SUPER_ADMIN is admitted by one path and rejected by the other with nothing to
 * catch it — the exact class of bug already recorded in
 * `.ai/memory/gotchas.jsonl`, where the implicit-all expansion existed in the
 * guard's assumption but had never been wired into the token.
 */
export function resolveSystemPermissions(roles: RoleWithPermissions[]): string[] {
  if (roles.some((role) => role.code === SystemRole.SUPER_ADMIN)) {
    return [...ALL_SYSTEM_PERMISSIONS]
  }
  return Array.from(new Set(roles.flatMap((role) => role.permissions ?? [])))
}
