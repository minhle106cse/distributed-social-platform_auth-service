import { IQuery } from '@distributed-social-platform/shared-kernel'

export class GetRoleQuery implements IQuery {
  public readonly name = GetRoleQuery.name
  constructor(public readonly code: string) {}
}
