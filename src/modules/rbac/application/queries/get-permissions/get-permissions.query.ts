import { IQuery } from '@/common/cqrs'

export class GetPermissionsQuery implements IQuery {
  public readonly name = GetPermissionsQuery.name
}
