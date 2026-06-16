import { IQuery } from '@/common/cqrs'

export class GetRolesQuery implements IQuery {
  public readonly name = GetRolesQuery.name
}
