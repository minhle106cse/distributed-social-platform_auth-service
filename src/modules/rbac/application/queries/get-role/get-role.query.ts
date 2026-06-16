import { IQuery } from '@/common/cqrs'

export class GetRoleQuery implements IQuery {
  public readonly name = GetRoleQuery.name
  constructor(public readonly code: string) {}
}
