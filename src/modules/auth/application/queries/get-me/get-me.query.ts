import { IQuery } from '@/common/cqrs'

export class GetMeQuery implements IQuery {
  public readonly name = 'GetMeQuery'
  constructor(public readonly userId: string) {}
}
