import type { IQuery } from '@distributed-social-platform/shared-kernel'

/**
 * Resolve a user's effective SYSTEM permissions from auth_db.
 *
 * Read by core-api's SystemPermissionGuard over gRPC on every platform-admin
 * request, so that tier stops trusting the JWT's `permissions` snapshot and
 * matches how Org RBAC has always worked (OrgGuard resolves per request).
 */
export class ResolveSystemPermissionsQuery implements IQuery {
  public readonly name = ResolveSystemPermissionsQuery.name

  constructor(public readonly userId: string) {}
}
