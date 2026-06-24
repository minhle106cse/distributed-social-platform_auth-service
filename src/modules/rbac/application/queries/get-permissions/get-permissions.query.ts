import type { IQuery } from '@distributed-social-platform/shared-kernel'

export class GetPermissionsQuery implements IQuery {
  public readonly name = GetPermissionsQuery.name
}
