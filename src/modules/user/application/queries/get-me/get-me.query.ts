import { IQuery } from '@/common/cqrs'

export class GetMeQuery implements IQuery {
  public readonly name = GetMeQuery.name
  constructor(public readonly userId: string) { }
}
